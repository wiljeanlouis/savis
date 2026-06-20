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
    OfferType,
    ProviderName,
    SortDirection,
)
from app.core.ports import OfferProviderNonRetryableError

if TYPE_CHECKING:
    from app.core.ports import (
        OfferProvider,
        OfferPublisher,
        OfferRepository,
    )

DEFAULT_REFRESH_FREQUENCY_HOURS = 24 * 7  # a week
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
        offer_publisher: OfferPublisher,
        offer_providers: dict[str, OfferProvider],
    ) -> None:
        """Initialize the use case."""
        self.offer_repository = offer_repository
        self.offer_publisher = offer_publisher
        self.offer_providers = offer_providers

    # celery worker use case - begin
    def get_offer(
        self,
        url: str,
        search_term: str,
        task_id: UUID,
        provider_name: ProviderName = ProviderName.MAXI,
        offer_type: OfferType = OfferType.FOOD,
    ) -> Offer | None:
        """Collect and persist one known provider offer."""
        provider = self.offer_providers.get(provider_name)
        if provider is None:
            msg = f"Unsupported offer provider: {provider_name}"
            raise ValueError(msg)

        try:
            offer = provider.get_offer_by_url(url=url)
        except OfferProviderNonRetryableError:
            logger.exception(
                "Offer provider blocked collection for term %s and url %s",
                search_term,
                url,
            )
            raise
        except Exception as exc:
            logger.exception(
                "Offer provider failed for term %s and url %s",
                search_term,
                url,
            )
            msg = (
                f"Offer adapter {provider_name!r} failed for "
                f"term {search_term!r} and URL {url!r}"
            )
            raise OfferCollectionFailedError(msg) from exc

        offers = [] if offer is None else [offer]
        self.save_observed_offers(
            offers=offers,
            search_term=search_term,
            task_id=task_id,
            offer_type=offer_type,
        )
        return offer

    def get_offers(
        self,
        search_term: str,
        task_id: UUID,
        offer_type: OfferType = OfferType.FOOD,
    ) -> list[Offer]:
        """Collect and persist offers for a search term."""
        results = []
        errors: list[Exception] = []
        non_retryable_errors: list[OfferProviderNonRetryableError] = []
        for provider in self.offer_providers.values():
            try:
                results.append(provider.get_offers(search_term))
            except OfferProviderNonRetryableError as exc:
                logger.exception("Offer provider cannot collect term %s", search_term)
                non_retryable_errors.append(exc)
            except Exception as exc:
                logger.exception("Offer provider failed for term %s", search_term)
                errors.append(exc)

        if not results and non_retryable_errors:
            raise non_retryable_errors[-1]
        if not results and errors:
            msg = f"All offer adapters failed for term {search_term!r}"
            raise OfferCollectionFailedError(msg) from errors[-1]

        offers = aggregate(results)
        self.save_observed_offers(
            offers=offers,
            search_term=search_term,
            task_id=task_id,
            offer_type=offer_type,
        )
        return offers

    def save_observed_offers(
        self,
        offers: list[Offer],
        search_term: str,
        task_id: UUID,
        offer_type: OfferType = OfferType.FOOD,
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
                    offer_type=offer_type,
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
                persisted_offer.offer_type = offer_type
                persisted_offer.last_retrieved_at = observed_at
                persisted_offer.next_refresh_at = observed_at + timedelta(
                    hours=persisted_offer.refresh_frequency_hours
                    or DEFAULT_REFRESH_FREQUENCY_HOURS,
                )
                persisted_offer.last_seen_task_id = task_id
            persisted_offers.append(self.offer_repository.save(persisted_offer))
        return persisted_offers

    def refresh_offer_by_url(
        self,
        offer_id: UUID,
        url: str,
        task_id: UUID,
        now: datetime | None = None,
    ) -> Offer | None:
        """Refresh one offer by URL and publish changed valid offers."""
        logger.info(
            "[OFFERS] refresh offer pending URL adapter | "
            "task_id=%s offer_id=%s url=%s",
            task_id,
            offer_id,
            url,
        )
        offer = self.offer_repository.find_by_id(offer_id)
        if offer is None:
            return None

        provider = self.offer_providers[offer.provider.name]
        refreshed_offer = provider.get_offer_by_url(url)
        if (
            refreshed_offer is None
            or refreshed_offer.price is None
            or not refreshed_offer.price.amount
        ):
            logger.info(
                "[OFFERS] skipping invalid refreshed offer | offer_id=%s",
                offer_id,
            )
            return None

        observed_at = now or datetime.now(UTC)
        has_changed = self._has_refreshed_price_or_package_size_changed(
            offer,
            refreshed_offer,
        )
        offer.price = refreshed_offer.price
        if refreshed_offer.package_size is not None:
            offer.package_size = refreshed_offer.package_size
        offer.last_retrieved_at = observed_at
        offer.next_refresh_at = observed_at + timedelta(
            hours=offer.refresh_frequency_hours or DEFAULT_REFRESH_FREQUENCY_HOURS,
        )

        saved_offer = self.offer_repository.save(offer)
        if has_changed and saved_offer.status == OfferStatus.VALID:
            self.offer_publisher.publish_offer(saved_offer)
        return saved_offer

    def find_due_valid_offers(self, now: datetime | None = None) -> list[Offer]:
        """Find valid offers due for scheduled refresh."""
        current_time = now or datetime.now(UTC)
        return self.offer_repository.find_due_for_refresh(current_time)

    def all_providers_have_offers_for_search_term(
        self,
        search_term: str,
        offer_type: OfferType,
    ) -> bool:
        """Return whether every configured provider already has offers."""
        configured_provider_identifiers = {
            getattr(provider, "identifier", provider_name)
            for provider_name, provider in self.offer_providers.items()
        }
        provider_identifiers_with_offers = (
            self.offer_repository.provider_identifiers_for_search_term(
                search_term,
                offer_type,
            )
        )
        return configured_provider_identifiers.issubset(
            provider_identifiers_with_offers,
        )

    def provider_identifiers_for_search_term(
        self,
        search_term: str,
        offer_type: OfferType,
    ) -> set[str]:
        """Return provider identifiers with offers for a search term and type."""
        return self.offer_repository.provider_identifiers_for_search_term(
            search_term,
            offer_type,
        )

    # celery worker use case - end

    # api use case - begin
    def list(  # noqa: PLR0913
        self,
        status: OfferStatus | None,
        page: int,
        size: int,
        sort_by: OfferSortField = OfferSortField.LAST_RETRIEVED_AT,
        sort_direction: SortDirection = SortDirection.DESC,
        offer_type: OfferType | None = None,
        search_term: str | None = None,
    ) -> tuple[list[Offer], int, int]:
        """List paginated offers."""
        offers, total_items = self.offer_repository.list(
            status,
            page,
            size,
            sort_by,
            sort_direction,
            offer_type,
            search_term,
        )
        total_pages = ceil(total_items / size) if total_items else 0
        return offers, total_items, total_pages

    def search_term_facets(
        self,
        status: OfferStatus | None = None,
        offer_type: OfferType | None = None,
    ) -> list[tuple[str, int]]:
        """Count offers grouped by search term."""
        return self.offer_repository.search_term_facets(status, offer_type)

    def patch(
        self,
        offer_id: UUID,
        *,
        status: OfferStatus | None = None,
        refresh_frequency_hours: int | None = None,
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

    def delete(self, offer_id: UUID) -> bool:
        """Delete an offer and invalidate it when it was published."""
        offer = self.offer_repository.find_by_id(offer_id)
        if offer is None:
            return False

        if offer.status == OfferStatus.VALID:
            self.offer_publisher.publish_offer_invalidation(offer)
        return self.offer_repository.delete(offer_id)

    # api use case - end

    @staticmethod
    def _has_refreshed_price_or_package_size_changed(
        current: Offer,
        refreshed: Offer,
    ) -> bool:
        return any(
            (
                current.price != refreshed.price,
                refreshed.package_size is not None
                and current.package_size != refreshed.package_size,
            ),
        )
