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
    PackageSize,
    Price,
    Provider,
    ProviderName,
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
            name=ProviderName.MAXI,
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
        self.due_offers: list[Offer] = []
        self.due_refresh_checks: list[datetime] = []
        self.provider_identifiers_by_search_term: dict[
            tuple[str, OfferType],
            set[str],
        ] = {}
        self.saved: list[Offer] = []
        self.deleted: list[UUID] = []

    def find_by_provider_and_external_id(
        self,
        provider: str,  # noqa: ARG002
        external_id: str,  # noqa: ARG002
    ) -> Offer | None:
        return self.offer

    def find_by_id(self, offer_id: UUID) -> Offer | None:  # noqa: ARG002
        return self.offer

    def list(  # noqa: PLR0913
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

    def find_due_for_refresh(self, now: datetime) -> list[Offer]:
        self.due_refresh_checks.append(now)
        return self.due_offers

    def provider_identifiers_for_search_term(
        self,
        search_term: str,
        offer_type: OfferType,
    ) -> set[str]:
        return self.provider_identifiers_by_search_term.get(
            (search_term, offer_type),
            set(),
        )

    def save(self, offer: Offer) -> Offer:
        self.saved.append(offer)
        return offer

    def delete(self, offer_id: UUID) -> bool:
        if self.offer is None:
            return False
        self.deleted.append(offer_id)
        self.offer = None
        return True


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

    def get_offer_by_url(self, url: str) -> Offer:  # noqa: ARG002
        offer = _offer()
        offer.price = Price("2")
        return offer


class EmptyProvider(OfferProvider):
    def get_offers(self, search_term: str) -> list[Offer]:  # noqa: ARG002
        return []

    def get_offer_by_url(self, url: str) -> Offer:  # noqa: ARG002
        offer = _offer()
        offer.price = Price("")
        return offer


class FailingProvider(OfferProvider):
    def get_offers(self, search_term: str) -> list[Offer]:
        msg = f"{search_term} timed out"
        raise TimeoutError(msg)

    def get_offer_by_url(self, url: str) -> Offer:
        msg = f"{url} timed out"
        raise TimeoutError(msg)


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


def test_refresh_offer_by_url_applies_changed_valid_offer_immediately() -> None:
    existing = _offer()
    existing.id = uuid7()
    existing.status = OfferStatus.VALID
    existing.refresh_frequency_hours = 24
    existing.package_size = PackageSize(value=1, unit="kg")
    original_url = existing.url
    original_brand = existing.brand
    original_label = existing.label
    original_image_url = existing.image_url
    original_provider = existing.provider
    repository = FakeOfferRepository(existing)
    publisher = FakeOfferPublisher()
    use_case = _use_case(repository=repository, publisher=publisher)
    refreshed = _offer()
    refreshed.price = Price(amount="5.49")
    refreshed.package_size = PackageSize(value=2, unit="kg")
    refreshed.url = "https://example.com/updated-offer"
    refreshed.brand = "Updated brand"
    refreshed.label = "Updated flour"
    refreshed.image_url = "https://example.com/updated-image.png"
    refreshed.provider = Provider(
        ProviderName.MAXI,
        "updated",
        "https://updated.example.com",
        "456 Street",
    )
    now = datetime(2026, 5, 18, 12, 0, tzinfo=UTC)

    class RefreshProvider(OfferProvider):
        def get_offers(self, search_term: str) -> list[Offer]:  # noqa: ARG002
            return []

        def get_offer_by_url(self, url: str) -> Offer:  # noqa: ARG002
            return refreshed

    use_case = _use_case(
        repository=repository,
        publisher=publisher,
        providers={existing.provider.name: RefreshProvider()},  # pyright: ignore[reportAbstractUsage]
    )

    offer = use_case.refresh_offer_by_url(existing.id, existing.url, uuid7(), now=now)

    assert offer is not None
    assert offer.price == Price(amount="5.49")
    assert offer.package_size == PackageSize(value=2, unit="kg")
    assert offer.url == original_url
    assert offer.brand == original_brand
    assert offer.label == original_label
    assert offer.image_url == original_image_url
    assert offer.provider == original_provider
    assert offer.last_retrieved_at == now
    assert offer.next_refresh_at == now + timedelta(hours=24)
    assert publisher.offers == [offer]


def test_refresh_offer_by_url_keeps_existing_package_size_when_missing() -> None:
    existing = _offer()
    existing.id = uuid7()
    existing.status = OfferStatus.VALID
    existing.refresh_frequency_hours = 24
    existing.package_size = PackageSize(value=1, unit="kg")
    repository = FakeOfferRepository(existing)
    publisher = FakeOfferPublisher()
    refreshed = _offer()
    refreshed.price = Price(amount="5.49")
    refreshed.package_size = None

    class RefreshProvider(OfferProvider):
        def get_offers(self, search_term: str) -> list[Offer]:  # noqa: ARG002
            return []

        def get_offer_by_url(self, url: str) -> Offer:  # noqa: ARG002
            return refreshed

    use_case = _use_case(
        repository=repository,
        publisher=publisher,
        providers={existing.provider.name: RefreshProvider()},  # pyright: ignore[reportAbstractUsage]
    )

    offer = use_case.refresh_offer_by_url(existing.id, existing.url, uuid7())

    assert offer is not None
    assert offer.price == Price(amount="5.49")
    assert offer.package_size == PackageSize(value=1, unit="kg")


def test_refresh_offer_by_url_does_not_publish_unreviewed_or_unchanged_offer() -> None:
    existing = _offer()
    existing.id = uuid7()
    existing.status = OfferStatus.NEW
    existing.refresh_frequency_hours = 24
    repository = FakeOfferRepository(existing)
    publisher = FakeOfferPublisher()
    use_case = _use_case(
        repository=repository,
        publisher=publisher,
        providers={existing.provider.name: SuccessfulProvider()},  # pyright: ignore[reportAbstractUsage]
    )

    offer = use_case.refresh_offer_by_url(existing.id, existing.url, uuid7())

    assert offer is not None
    assert publisher.offers == []


def test_refresh_offer_by_url_ignores_invalid_refreshed_offer() -> None:
    existing = _offer()
    existing.id = uuid7()
    existing.status = OfferStatus.VALID
    existing.refresh_frequency_hours = 24
    original_price = existing.price
    original_next_refresh_at = existing.next_refresh_at
    repository = FakeOfferRepository(existing)
    publisher = FakeOfferPublisher()
    use_case = _use_case(
        repository=repository,
        publisher=publisher,
        providers={existing.provider.name: EmptyProvider()},  # pyright: ignore[reportAbstractUsage]
    )

    offer = use_case.refresh_offer_by_url(existing.id, existing.url, uuid7())

    assert offer is None
    assert existing.price == original_price
    assert existing.next_refresh_at == original_next_refresh_at
    assert repository.saved == []
    assert publisher.offers == []


def test_get_offers_collects_tracks_and_returns_aggregated_results() -> None:
    repository = FakeOfferRepository()
    use_case = _use_case(
        repository=repository,
        providers={"success": SuccessfulProvider()},  # pyright: ignore[reportAbstractUsage]
    )
    task_id = uuid7()

    offers = use_case.get_offers("flour", task_id)

    assert [offer.label for offer in offers] == ["flour-offer"]
    assert repository.saved[0].search_term == "flour"
    assert repository.saved[0].last_seen_task_id == task_id


def test_get_offer_uses_selected_provider_and_tracks_result() -> None:
    repository = FakeOfferRepository()
    provider = SuccessfulProvider()
    use_case = _use_case(
        repository=repository,
        providers={ProviderName.MAXI: provider},
    )
    task_id = uuid7()

    offer = use_case.get_offer(
        url="https://www.maxi.ca/flour/p/12345",
        search_term="flour",
        task_id=task_id,
        provider_name=ProviderName.MAXI,
        offer_type=OfferType.MATERIAL,
    )

    assert offer is not None
    assert repository.saved[0].search_term == "flour"
    assert repository.saved[0].offer_type == OfferType.MATERIAL
    assert repository.saved[0].last_seen_task_id == task_id


def test_get_offer_raises_when_selected_provider_fails() -> None:
    use_case = _use_case(
        providers={ProviderName.MAXI: FailingProvider()},
    )

    with pytest.raises(OfferCollectionFailedError, match="Maxi"):
        use_case.get_offer(
            url="https://www.maxi.ca/flour/p/12345",
            search_term="flour",
            task_id=uuid7(),
            provider_name=ProviderName.MAXI,
        )


def test_get_offers_raises_when_all_adapters_fail() -> None:
    use_case = _use_case(providers={"failure": FailingProvider()})  # pyright: ignore[reportAbstractUsage]

    with pytest.raises(OfferCollectionFailedError, match="All offer adapters failed"):
        use_case.get_offers("farine", uuid7())


def test_get_offers_allows_successful_empty_results() -> None:
    use_case = _use_case(providers={"emppty": EmptyProvider()})  # pyright: ignore[reportAbstractUsage]

    assert use_case.get_offers("unknown", uuid7()) == []


def test_find_due_valid_offers_delegates_to_repository() -> None:
    now = datetime(2026, 5, 27, 12, 0, tzinfo=UTC)
    due_offer = _offer()
    repository = FakeOfferRepository()
    repository.due_offers = [due_offer]
    use_case = _use_case(repository=repository)

    offers = use_case.find_due_valid_offers(now=now)

    assert offers == [due_offer]
    assert repository.due_refresh_checks == [now]


def test_all_providers_have_offers_for_search_term_compares_providers() -> None:
    repository = FakeOfferRepository()
    repository.provider_identifiers_by_search_term = {
        ("flour", OfferType.FOOD): {"example"},
    }
    use_case = _use_case(
        repository=repository,
        providers={"example": SuccessfulProvider()},  # pyright: ignore[reportAbstractUsage]
    )

    assert (
        use_case.all_providers_have_offers_for_search_term("flour", OfferType.FOOD)
        is True
    )


def test_all_providers_have_offers_for_search_term_detects_missing_provider() -> None:
    repository = FakeOfferRepository()
    repository.provider_identifiers_by_search_term = {
        ("flour", OfferType.FOOD): {"example"},
    }

    class OtherProvider(SuccessfulProvider):
        identifier = "other"

    use_case = _use_case(
        repository=repository,
        providers={"example": SuccessfulProvider(), "other": OtherProvider()},  # pyright: ignore[reportAbstractUsage]
    )

    assert (
        use_case.all_providers_have_offers_for_search_term("flour", OfferType.FOOD)
        is False
    )


def test_delete_removes_offer_and_invalidates_valid_offer() -> None:
    existing = _offer()
    existing.id = uuid7()
    existing.status = OfferStatus.VALID
    repository = FakeOfferRepository(existing)
    publisher = FakeOfferPublisher()
    use_case = _use_case(repository=repository, publisher=publisher)

    assert use_case.delete(existing.id) is True
    assert repository.deleted == [existing.id]
    assert publisher.invalidations == [existing]


def test_delete_returns_false_when_offer_does_not_exist() -> None:
    repository = FakeOfferRepository()
    publisher = FakeOfferPublisher()
    use_case = _use_case(repository=repository, publisher=publisher)

    assert use_case.delete(uuid7()) is False
    assert repository.deleted == []
    assert publisher.invalidations == []


def test_refresh_offer_by_url_is_placeholder_entrypoint() -> None:
    use_case = _use_case()

    assert (
        use_case.refresh_offer_by_url(uuid7(), "https://example.com", uuid7()) is None
    )
