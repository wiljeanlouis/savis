"""Tests for offer use cases."""

# ruff: noqa: D101, D102, D103, D107, S101

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid7

import pytest

from app.core.models import (
    Offer,
    OfferSortField,
    OfferStatus,
    OfferType,
    Price,
    Provider,
    SortDirection,
)
from app.core.ports import (
    OfferProvider,
    OfferPublisher,
    OfferRepository,
)
from app.core.use_case_offers import OfferCollectionFailedError, OffersUseCase

REFRESH_FREQUENCY_SIX_HOURS = 6


def _offer() -> Offer:
    return Offer(
        id=None,
        external_id="external-id",
        url="https://example.com/offer",
        brand="Example",
        label="Flour",
        price=Price(amount="4.99"),
        package_size=None,
        image_url="https://example.com/image.png",
        provider=Provider(
            name="Example Provider",
            identifier="example",
            site="https://example.com",
            address="123 Example Street",
        ),
        last_retrieved_at=datetime(2026, 5, 17, 12, 0, tzinfo=UTC),
        next_refresh_at=datetime(2026, 5, 18, 12, 0, tzinfo=UTC),
    )


class FakeOfferRepository(OfferRepository):
    def __init__(self, offer: Offer | None = None) -> None:
        self.offer = offer
        self.saved: list[Offer] = []

    def find_by_provider_and_external_id(
        self,
        provider: str,  # noqa: ARG002
        external_id: str,  # noqa: ARG002
    ) -> Offer | None:
        return self.offer

    def find_by_id(self, offer_id: UUID) -> Offer | None:  # noqa: ARG002
        return self.offer

    def list(
        self,
        status: OfferStatus | None,  # noqa: ARG002
        page: int,  # noqa: ARG002
        size: int,  # noqa: ARG002
        sort_by: OfferSortField = OfferSortField.LAST_RETRIEVED_AT,  # noqa: ARG002
        sort_direction: SortDirection = SortDirection.DESC,  # noqa: ARG002
        offer_type: OfferType | None = None,  # noqa: ARG002
        search_term: str | None = None,  # noqa: ARG002
    ) -> tuple[list[Offer], int]:
        return (
            [] if self.offer is None else [self.offer],
            0 if self.offer is None else 1,
        )

    def search_term_facets(
        self,
        status: OfferStatus | None = None,  # noqa: ARG002
        offer_type: OfferType | None = None,  # noqa: ARG002
    ) -> list[tuple[str, int]]:
        return [] if self.offer is None else [(self.offer.search_term or "", 1)]

    def save(self, offer: Offer) -> Offer:
        self.saved.append(offer)
        return offer


class FakeOfferPublisher(OfferPublisher):
    def __init__(self) -> None:
        self.offers: list[Offer] = []
        self.invalidations: list[Offer] = []

    def publish_offer(self, offer: Offer) -> None:
        self.offers.append(offer)

    def publish_offer_invalidation(self, offer: Offer) -> None:
        self.invalidations.append(offer)


class SuccessfulProvider(OfferProvider):
    def get_offers(self, search_term: str) -> list[Offer]:
        offer = _offer()
        offer.label = f"{search_term}-offer"
        return [offer]

    def refresh_offer_price_by_url(self, url: str) -> Price:
        return Price("2")


class EmptyProvider(OfferProvider):
    def get_offers(self, search_term: str) -> list[Offer]:  # noqa: ARG002
        return []

    def refresh_offer_price_by_url(self, url: str) -> Price:
        return Price("")


class FailingProvider(OfferProvider):
    def get_offers(self, search_term: str) -> list[Offer]:
        msg = f"{search_term} timed out"
        raise TimeoutError(msg)

    def refresh_offer_price_by_url(self, url: str) -> Price:
        return Price("2")


def _use_case(
    repository: FakeOfferRepository | None = None,
    publisher: FakeOfferPublisher | None = None,
    providers: dict[str, OfferProvider] | None = None,
) -> OffersUseCase:
    return OffersUseCase(
        repository or FakeOfferRepository(),
        publisher or FakeOfferPublisher(),
        providers or {},
    )


def test_save_observed_offers_creates_new_offer_as_new() -> None:
    repository = FakeOfferRepository()
    use_case = _use_case(repository=repository)
    task_id = uuid7()
    now = datetime(2026, 5, 17, 12, 0, tzinfo=UTC)

    offers = use_case.save_observed_offers([_offer()], "flour", task_id, now=now)

    assert offers[0].status == OfferStatus.NEW
    assert offers[0].search_term == "flour"
    assert offers[0].last_seen_task_id == task_id


def test_save_observed_offers_preserves_existing_status() -> None:
    existing = _offer()
    existing.id = uuid7()
    existing.status = OfferStatus.REJECTED
    existing.refresh_frequency_hours = 12
    repository = FakeOfferRepository(existing)
    use_case = _use_case(repository=repository)
    now = datetime(2026, 5, 18, 12, 0, tzinfo=UTC)

    offers = use_case.save_observed_offers([_offer()], "farine", uuid7(), now=now)

    assert offers[0].status == OfferStatus.REJECTED
    assert offers[0].next_refresh_at == now + timedelta(hours=12)


def test_patch_updates_status_frequency_and_publishes_when_validated() -> None:
    existing = _offer()
    existing.id = uuid7()
    existing.status = OfferStatus.NEW
    existing.refresh_frequency_hours = 24
    repository = FakeOfferRepository(existing)
    publisher = FakeOfferPublisher()
    use_case = _use_case(
        repository=repository,
        publisher=publisher,
    )
    now = datetime(2026, 5, 18, 12, 0, tzinfo=UTC)

    offer = use_case.patch(
        existing.id,
        status=OfferStatus.VALID,
        refresh_frequency_hours=REFRESH_FREQUENCY_SIX_HOURS,
        now=now,
    )

    assert offer is not None
    assert offer.status == OfferStatus.VALID
    assert offer.refresh_frequency_hours == REFRESH_FREQUENCY_SIX_HOURS
    assert offer.next_refresh_at == now + timedelta(
        hours=REFRESH_FREQUENCY_SIX_HOURS,
    )
    assert publisher.offers == [offer]


def test_patch_does_not_republish_already_valid_offer() -> None:
    existing = _offer()
    existing.id = uuid7()
    existing.status = OfferStatus.VALID
    existing.refresh_frequency_hours = 24
    repository = FakeOfferRepository(existing)
    publisher = FakeOfferPublisher()
    use_case = _use_case(repository=repository, publisher=publisher)

    offer = use_case.patch(existing.id, refresh_frequency_hours=12)

    assert offer is not None
    assert offer.status == OfferStatus.VALID
    assert publisher.offers == []


def test_patch_invalidates_published_offer_when_rejected() -> None:
    existing = _offer()
    existing.id = uuid7()
    existing.status = OfferStatus.VALID
    existing.refresh_frequency_hours = 24
    repository = FakeOfferRepository(existing)
    publisher = FakeOfferPublisher()
    use_case = _use_case(repository=repository, publisher=publisher)

    offer = use_case.patch(existing.id, status=OfferStatus.REJECTED)

    assert offer is not None
    assert offer.status == OfferStatus.REJECTED
    assert publisher.offers == []
    assert publisher.invalidations == [offer]


def test_apply_refreshed_offer_publishes_changed_valid_offer_immediately() -> None:
    existing = _offer()
    existing.id = uuid7()
    existing.status = OfferStatus.VALID
    existing.refresh_frequency_hours = 24
    repository = FakeOfferRepository(existing)
    publisher = FakeOfferPublisher()
    use_case = _use_case(repository=repository, publisher=publisher)
    refreshed = _offer()
    refreshed.price = Price(amount="5.49")
    now = datetime(2026, 5, 18, 12, 0, tzinfo=UTC)

    offer = use_case.apply_refreshed_offer(existing.id, refreshed, now=now)

    assert offer is not None
    assert offer.price == Price(amount="5.49")
    assert offer.last_retrieved_at == now
    assert offer.next_refresh_at == now + timedelta(hours=24)
    assert publisher.offers == [offer]


def test_apply_refreshed_offer_does_not_publish_unreviewed_or_unchanged_offer() -> None:
    existing = _offer()
    existing.id = uuid7()
    existing.status = OfferStatus.NEW
    existing.refresh_frequency_hours = 24
    repository = FakeOfferRepository(existing)
    publisher = FakeOfferPublisher()
    use_case = _use_case(repository=repository, publisher=publisher)

    offer = use_case.apply_refreshed_offer(existing.id, _offer())

    assert offer is not None
    assert publisher.offers == []


def test_get_offers_collects_tracks_and_returns_aggregated_results() -> None:
    repository = FakeOfferRepository()
    use_case = _use_case(
        repository=repository,
        providers={"success": SuccessfulProvider()},
    )
    task_id = uuid7()

    offers = use_case.get_offers("flour", task_id)

    assert [offer.label for offer in offers] == ["flour-offer"]
    assert repository.saved[0].search_term == "flour"
    assert repository.saved[0].last_seen_task_id == task_id


def test_get_offers_raises_when_all_adapters_fail() -> None:
    use_case = _use_case(providers={"failure": FailingProvider()})

    with pytest.raises(OfferCollectionFailedError, match="All offer adapters failed"):
        use_case.get_offers("farine", uuid7())


def test_get_offers_allows_successful_empty_results() -> None:
    use_case = _use_case(providers={"emppty": EmptyProvider()})

    assert use_case.get_offers("unknown", uuid7()) == []


def test_refresh_offer_by_url_is_placeholder_entrypoint() -> None:
    use_case = _use_case()

    assert (
        use_case.refresh_offer_by_url(uuid7(), "https://example.com", uuid7()) is None
    )
