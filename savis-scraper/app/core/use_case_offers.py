"""Use cases for persisted offers."""

from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime, timedelta
from math import ceil
from typing import TYPE_CHECKING
from uuid import UUID, uuid7

from app.core.models import Offer, OfferStatus

if TYPE_CHECKING:
    from app.core.ports import OfferPublisher, OfferRepository, TaskQueue

DEFAULT_REFRESH_FREQUENCY_HOURS = 24


class OffersUseCase:
    """Manage scraped offers awaiting human review."""

    def __init__(
        self,
        offer_repository: OfferRepository,
        task_queue: TaskQueue,
        offer_publisher: OfferPublisher,
    ) -> None:
        """Initialize the use case."""
        self.offer_repository = offer_repository
        self.task_queue = task_queue
        self.offer_publisher = offer_publisher

    def track(
        self,
        offers: list[Offer],
        search_term: str,
        scraping_task_id: UUID,
        now: datetime | None = None,
    ) -> list[Offer]:
        """Create or refresh persisted offers from a successful scrape."""
        observed_at = now or datetime.now(UTC)
        persisted_offers = []
        for scraped_offer in offers:
            persisted_offer = self.offer_repository.find_by_provider_and_external_id(
                provider=scraped_offer.provider.identifier,
                external_id=scraped_offer.external_id,
            )
            if persisted_offer is None:
                persisted_offer = replace(
                    scraped_offer,
                    id=uuid7(),
                    search_term=search_term,
                    status=OfferStatus.NEW,
                    last_scraped_at=observed_at,
                    next_refresh_at=observed_at
                    + timedelta(hours=DEFAULT_REFRESH_FREQUENCY_HOURS),
                    refresh_frequency_hours=DEFAULT_REFRESH_FREQUENCY_HOURS,
                    last_seen_task_id=scraping_task_id,
                )
            else:
                persisted_offer.url = scraped_offer.url
                persisted_offer.brand = scraped_offer.brand
                persisted_offer.label = scraped_offer.label
                persisted_offer.price = scraped_offer.price
                persisted_offer.package_size = scraped_offer.package_size
                persisted_offer.image_url = scraped_offer.image_url
                persisted_offer.provider = scraped_offer.provider
                persisted_offer.search_term = search_term
                persisted_offer.last_scraped_at = observed_at
                persisted_offer.next_refresh_at = observed_at + timedelta(
                    hours=persisted_offer.refresh_frequency_hours
                    or DEFAULT_REFRESH_FREQUENCY_HOURS,
                )
                persisted_offer.last_seen_task_id = scraping_task_id
            persisted_offers.append(self.offer_repository.save(persisted_offer))
        return persisted_offers

    def list(
        self,
        status: OfferStatus | None,
        page: int,
        size: int,
    ) -> tuple[list[Offer], int, int]:
        """List paginated offers."""
        offers, total_items = self.offer_repository.list(status, page, size)
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
            self.task_queue.push_refresh_offer(str(offer.id), offer.url)

        saved_offer = self.offer_repository.save(offer)
        if (
            previous_status != OfferStatus.VALID
            and saved_offer.status == OfferStatus.VALID
        ):
            self.offer_publisher.publish_offer(saved_offer)
        return saved_offer

    def refresh(
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
        offer.last_scraped_at = observed_at
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
