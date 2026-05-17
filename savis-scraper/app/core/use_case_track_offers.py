"""Use case for tracking offers that should be refreshed later."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid7

from app.core.models import TrackedOffer

if TYPE_CHECKING:
    from app.core.models import Offer
    from app.core.ports import TrackedOfferRepository

DEFAULT_REFRESH_FREQUENCY_HOURS = 24


class TrackOffersUseCase:
    """Store the latest observation of provider offers."""

    def __init__(self, tracked_offer_repository: TrackedOfferRepository) -> None:
        """Initialize the use case."""
        self.tracked_offer_repository = tracked_offer_repository

    def track(
        self,
        offers: list[Offer],
        search_term: str,
        scraping_task_id: UUID,
        now: datetime | None = None,
    ) -> list[TrackedOffer]:
        """Create or refresh tracked offers from one successful scraping run."""
        observed_at = now or datetime.now(UTC)
        next_refresh_at = observed_at + timedelta(
            hours=DEFAULT_REFRESH_FREQUENCY_HOURS,
        )
        tracked_offers = []

        for offer in offers:
            tracked_offer = (
                self.tracked_offer_repository.find_by_provider_and_external_id(
                    provider=offer.provider.identifier,
                    external_id=offer.external_id,
                )
            )
            if tracked_offer is None:
                tracked_offer = TrackedOffer(
                    id=uuid7(),
                    provider=offer.provider.identifier,
                    url=offer.url,
                    external_id=offer.external_id,
                    search_term=search_term,
                    last_known_price=_price_amount(offer),
                    last_scraped_at=observed_at,
                    next_refresh_at=next_refresh_at,
                    refresh_frequency_hours=DEFAULT_REFRESH_FREQUENCY_HOURS,
                    last_seen_task_id=scraping_task_id,
                )
            else:
                tracked_offer.url = offer.url
                tracked_offer.search_term = search_term
                tracked_offer.last_known_price = _price_amount(offer)
                tracked_offer.last_scraped_at = observed_at
                tracked_offer.next_refresh_at = next_refresh_at
                tracked_offer.last_seen_task_id = scraping_task_id

            tracked_offers.append(self.tracked_offer_repository.save(tracked_offer))

        return tracked_offers


def _price_amount(offer: Offer) -> Decimal | None:
    if offer.price is None:
        return None

    return Decimal(offer.price.amount)
