"""Tests for tracked offer use case."""

# ruff: noqa: D101, D102, D103, D107, S101

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid7

from app.core.models import Offer, Price, Provider, TrackedOffer
from app.core.ports import TrackedOfferRepository
from app.core.use_case_track_offers import TrackOffersUseCase

DEFAULT_REFRESH_FREQUENCY_HOURS = 24


def _offer(
    *,
    external_id: str = "external-id",
    url: str = "https://example.com/offer",
    amount: str | None = "4.99",
) -> Offer:
    return Offer(
        external_id=external_id,
        url=url,
        brand="Example",
        label="Flour",
        price=None if amount is None else Price(amount=amount),
        package_size=None,
        image_url="https://example.com/image.png",
        provider=Provider(
            name="Example Provider",
            identifier="example",
            site="https://example.com",
            address="123 Example Street",
        ),
    )


class FakeTrackedOfferRepository(TrackedOfferRepository):
    def __init__(self, tracked_offer: TrackedOffer | None = None) -> None:
        self.tracked_offer = tracked_offer
        self.lookups: list[tuple[str, str]] = []
        self.saved: list[TrackedOffer] = []

    def find_by_provider_and_external_id(
        self,
        provider: str,
        external_id: str,
    ) -> TrackedOffer | None:
        self.lookups.append((provider, external_id))
        return self.tracked_offer

    def save(self, tracked_offer: TrackedOffer) -> TrackedOffer:
        self.saved.append(tracked_offer)
        return tracked_offer


def test_track_creates_new_tracked_offer() -> None:
    repository = FakeTrackedOfferRepository()
    use_case = TrackOffersUseCase(repository)
    task_id = uuid7()
    now = datetime(2026, 5, 17, 12, 0, tzinfo=UTC)

    tracked_offers = use_case.track([_offer()], "flour", task_id, now=now)

    tracked_offer = tracked_offers[0]
    assert repository.lookups == [("example", "external-id")]
    assert tracked_offer.provider == "example"
    assert tracked_offer.url == "https://example.com/offer"
    assert tracked_offer.external_id == "external-id"
    assert tracked_offer.search_term == "flour"
    assert tracked_offer.last_known_price == Decimal("4.99")
    assert tracked_offer.last_scraped_at == now
    assert tracked_offer.next_refresh_at == now + timedelta(
        hours=DEFAULT_REFRESH_FREQUENCY_HOURS,
    )
    assert tracked_offer.refresh_frequency_hours == DEFAULT_REFRESH_FREQUENCY_HOURS
    assert tracked_offer.last_seen_task_id == task_id


def test_track_updates_existing_tracked_offer() -> None:
    original_task_id = uuid7()
    existing = TrackedOffer(
        id=uuid7(),
        provider="example",
        url="https://example.com/old-offer",
        external_id="external-id",
        search_term="old",
        last_known_price=Decimal("3.99"),
        last_scraped_at=datetime(2026, 5, 16, 12, 0, tzinfo=UTC),
        next_refresh_at=datetime(2026, 5, 17, 12, 0, tzinfo=UTC),
        refresh_frequency_hours=24,
        last_seen_task_id=original_task_id,
    )
    repository = FakeTrackedOfferRepository(existing)
    use_case = TrackOffersUseCase(repository)
    new_task_id = uuid7()
    now = datetime(2026, 5, 17, 12, 0, tzinfo=UTC)

    tracked_offers = use_case.track(
        [_offer(url="https://example.com/new-offer", amount=None)],
        "farine",
        new_task_id,
        now=now,
    )

    assert tracked_offers == [existing]
    assert repository.saved == [existing]
    assert existing.url == "https://example.com/new-offer"
    assert existing.search_term == "farine"
    assert existing.last_known_price is None
    assert existing.last_scraped_at == now
    assert existing.next_refresh_at == now + timedelta(
        hours=DEFAULT_REFRESH_FREQUENCY_HOURS,
    )
    assert existing.last_seen_task_id == new_task_id
