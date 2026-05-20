"""Use cases for persisted offers."""

from __future__ import annotations

import logging
from dataclasses import replace
from datetime import UTC, datetime, timedelta
from math import ceil
from typing import TYPE_CHECKING
from uuid import UUID, uuid7

from app.core.models import (
    Offer,
    OfferSortField,
    OfferStatus,
    SavisTask,
    SavisTaskType,
    SortDirection,
)

if TYPE_CHECKING:
    from app.core.ports import (
        OfferProvider,
        OfferPublisher,
        OfferRepository,
        SavisTaskRepository,
        TaskQueue,
    )

DEFAULT_REFRESH_FREQUENCY_HOURS = 24
logger = logging.getLogger(__name__)


class OfferCollectionFailedError(RuntimeError):
    """Raised when no offer adapter can return a successful result."""


def aggregate(results: list[list[Offer]]) -> list[Offer]:
    """Aggregate offers from multiple adapter results."""
    logger.info("[AGGREGATOR] Start aggregation with {%s} sources", len(results))
    offers = [offer for source_result in results for offer in source_result]
    logger.info("[AGGREGATOR] Aggregated {%s} offers", len(offers))
    return offers


class OffersUseCase:
    """Manage offers."""

    def __init__(
        self,
        offer_repository: OfferRepository,
        task_queue: TaskQueue,
        offer_publisher: OfferPublisher,
        task_repository: SavisTaskRepository,
        offer_providers: list[OfferProvider],
    ) -> None:
        """Initialize the use case."""
        self.offer_repository = offer_repository
        self.task_queue = task_queue
        self.offer_publisher = offer_publisher
        self.task_repository = task_repository
        self.offer_providers = offer_providers

    def get_offers(self, search_term: str, task_id: UUID) -> list[Offer]:
        """Collect and persist offers for a search term."""
        results = []
        errors: list[Exception] = []
        for provider in self.offer_providers:
            try:
                results.append(provider.get_offers(search_term))
            except Exception as exc:
                logger.exception("Offer provider failed for term %s", search_term)
                errors.append(exc)

        if not results and errors:
            msg = f"All offer adapters failed for term {search_term!r}"
            raise OfferCollectionFailedError(msg) from errors[-1]

        offers = aggregate(results)
        self.save_observed_offers(
            offers=offers,
            search_term=search_term,
            task_id=task_id,
        )
        return offers

    def refresh_offer_by_url(self, offer_id: UUID, url: str, task_id: UUID) -> None:
        """Refresh one offer by URL once URL adapters are implemented."""
        logger.info(
            "[OFFERS] refresh offer pending URL adapter | "
            "task_id=%s offer_id=%s url=%s",
            task_id,
            offer_id,
            url,
        )

    def save_observed_offers(
        self,
        offers: list[Offer],
        search_term: str,
        task_id: UUID,
        now: datetime | None = None,
    ) -> list[Offer]:
        """Create or refresh persisted offers from a successful provider result."""
        observed_at = now or datetime.now(UTC)
        persisted_offers = []
        for observed_offer in offers:
            persisted_offer = self.offer_repository.find_by_provider_and_external_id(
                provider=observed_offer.provider.identifier,
                external_id=observed_offer.external_id,
            )
            if persisted_offer is None:
                persisted_offer = replace(
                    observed_offer,
                    id=uuid7(),
                    search_term=search_term,
                    status=OfferStatus.NEW,
                    last_retrieved_at=observed_at,
                    next_refresh_at=observed_at
                    + timedelta(hours=DEFAULT_REFRESH_FREQUENCY_HOURS),
                    refresh_frequency_hours=DEFAULT_REFRESH_FREQUENCY_HOURS,
                    last_seen_task_id=task_id,
                )
            else:
                persisted_offer.url = observed_offer.url
                persisted_offer.brand = observed_offer.brand
                persisted_offer.label = observed_offer.label
                persisted_offer.price = observed_offer.price
                persisted_offer.package_size = observed_offer.package_size
                persisted_offer.image_url = observed_offer.image_url
                persisted_offer.provider = observed_offer.provider
                persisted_offer.search_term = search_term
                persisted_offer.last_retrieved_at = observed_at
                persisted_offer.next_refresh_at = observed_at + timedelta(
                    hours=persisted_offer.refresh_frequency_hours
                    or DEFAULT_REFRESH_FREQUENCY_HOURS,
                )
                persisted_offer.last_seen_task_id = task_id
            persisted_offers.append(self.offer_repository.save(persisted_offer))
        return persisted_offers

    def list(
        self,
        status: OfferStatus | None,
        page: int,
        size: int,
        sort_by: OfferSortField = OfferSortField.LAST_RETRIEVED_AT,
        sort_direction: SortDirection = SortDirection.DESC,
    ) -> tuple[list[Offer], int, int]:
        """List paginated offers."""
        offers, total_items = self.offer_repository.list(
            status,
            page,
            size,
            sort_by,
            sort_direction,
        )
        total_pages = ceil(total_items / size) if total_items else 0
        return offers, total_items, total_pages

    def patch(
        self,
        offer_id: UUID,
        *,
        status: OfferStatus | None = None,
        refresh_frequency_hours: int | None = None,
        refresh_now: bool = False,
        now: datetime | None = None,
    ) -> Offer | None:
        """Update review and refresh settings for an offer."""
        offer = self.offer_repository.find_by_id(offer_id)
        if offer is None:
            return None

        current_time = now or datetime.now(UTC)
        previous_status = offer.status
        if status is not None:
            offer.status = status
        if refresh_frequency_hours is not None:
            offer.refresh_frequency_hours = refresh_frequency_hours
            offer.next_refresh_at = current_time + timedelta(
                hours=refresh_frequency_hours,
            )
        if refresh_now:
            task = self.task_repository.save(
                SavisTask.create(
                    SavisTaskType.REFRESH_OFFER,
                    {"offer_id": str(offer.id), "url": offer.url},
                ),
            )
            try:
                self.task_queue.push_refresh_offer(
                    str(task.id),
                    str(offer.id),
                    offer.url,
                )
            except Exception as exc:
                self.task_repository.mark_failed(task.id, str(exc))
                raise

        saved_offer = self.offer_repository.save(offer)
        if (
            previous_status != OfferStatus.VALID
            and saved_offer.status == OfferStatus.VALID
        ):
            self.offer_publisher.publish_offer(saved_offer)
        if (
            previous_status == OfferStatus.VALID
            and saved_offer.status == OfferStatus.REJECTED
        ):
            self.offer_publisher.publish_offer_invalidation(saved_offer)
        return saved_offer

    def apply_refreshed_offer(
        self,
        offer_id: UUID,
        refreshed_offer: Offer,
        now: datetime | None = None,
    ) -> Offer | None:
        """Apply a URL refresh and publish changed valid offers immediately."""
        offer = self.offer_repository.find_by_id(offer_id)
        if offer is None:
            return None

        observed_at = now or datetime.now(UTC)
        has_changed = self._has_public_changes(offer, refreshed_offer)
        offer.url = refreshed_offer.url
        offer.brand = refreshed_offer.brand
        offer.label = refreshed_offer.label
        offer.price = refreshed_offer.price
        offer.package_size = refreshed_offer.package_size
        offer.image_url = refreshed_offer.image_url
        offer.provider = refreshed_offer.provider
        offer.last_retrieved_at = observed_at
        offer.next_refresh_at = observed_at + timedelta(
            hours=offer.refresh_frequency_hours or DEFAULT_REFRESH_FREQUENCY_HOURS,
        )

        saved_offer = self.offer_repository.save(offer)
        if has_changed and saved_offer.status == OfferStatus.VALID:
            self.offer_publisher.publish_offer(saved_offer)
        return saved_offer

    @staticmethod
    def _has_public_changes(current: Offer, refreshed: Offer) -> bool:
        return any(
            (
                current.url != refreshed.url,
                current.brand != refreshed.brand,
                current.label != refreshed.label,
                current.price != refreshed.price,
                current.package_size != refreshed.package_size,
                current.image_url != refreshed.image_url,
                current.provider != refreshed.provider,
            ),
        )
