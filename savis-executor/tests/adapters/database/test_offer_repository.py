"""Tests for SQLAlchemy offer repository."""

# ruff: noqa: D103, S101

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid7

import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.adapters.database.offer_repository import (
    OfferEntity,
    SqlAlchemyOfferRepository,
)
from app.adapters.database.session import Base
from app.core.models import (
    Offer,
    OfferSortField,
    OfferStatus,
    OfferType,
    Price,
    Provider,
    SortDirection,
)

EXPECTED_SORT_TOTAL = 2


def _repository() -> tuple[SqlAlchemyOfferRepository, sessionmaker[Session]]:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    return (
        SqlAlchemyOfferRepository(
            session_factory=session_factory,
            schema_creator=lambda: None,
        ),
        session_factory,
    )


def _offer(
    *,
    external_id: str = "external-id",
    status: OfferStatus = OfferStatus.NEW,
    price_amount: str = "4.99",
    offer_type: OfferType = OfferType.FOOD,
    next_refresh_at: datetime | None = None,
) -> Offer:
    now = datetime(2026, 5, 17, 12, 0, tzinfo=UTC)
    return Offer(
        id=uuid7(),
        external_id=external_id,
        url="https://example.com/offer",
        brand="Example",
        label="Flour",
        price=Price(amount=price_amount),
        package_size=None,
        image_url="https://example.com/image.png",
        provider=Provider(
            "Example Provider",
            "example",
            "https://example.com",
            "123 Street",
        ),
        search_term="flour",
        status=status,
        offer_type=offer_type,
        last_retrieved_at=now,
        next_refresh_at=next_refresh_at or now + timedelta(hours=24),
        refresh_frequency_hours=24,
        last_seen_task_id=uuid7(),
    )


def test_save_persists_complete_offer() -> None:
    repository, session_factory = _repository()
    offer = _offer()

    repository.save(offer)

    with session_factory() as session:
        entity = session.get(OfferEntity, str(offer.id))

    assert entity is not None
    assert entity.price_amount == Decimal("4.9900")
    assert entity.status == OfferStatus.NEW.value
    assert entity.offer_type == OfferType.FOOD.value


def test_list_filters_and_paginates() -> None:
    repository, _session_factory = _repository()
    repository.save(_offer(external_id="a", status=OfferStatus.NEW))
    repository.save(_offer(external_id="b", status=OfferStatus.VALID))

    offers, total = repository.list(OfferStatus.VALID, page=1, size=10)

    assert total == 1
    assert [offer.external_id for offer in offers] == ["b"]


def test_list_filters_by_offer_type() -> None:
    repository, _session_factory = _repository()
    repository.save(_offer(external_id="food", offer_type=OfferType.FOOD))
    repository.save(
        _offer(external_id="decoration", offer_type=OfferType.DECORATION),
    )

    offers, total = repository.list(None, page=1, size=10, offer_type=OfferType.FOOD)

    assert total == 1
    assert [offer.external_id for offer in offers] == ["food"]


def test_find_due_for_refresh_returns_valid_due_offers_only() -> None:
    repository, _session_factory = _repository()
    now = datetime(2026, 5, 18, 12, 0, tzinfo=UTC)
    repository.save(
        _offer(
            external_id="due-valid",
            status=OfferStatus.VALID,
            next_refresh_at=now,
        ),
    )
    repository.save(
        _offer(
            external_id="future-valid",
            status=OfferStatus.VALID,
            next_refresh_at=now + timedelta(minutes=1),
        ),
    )
    repository.save(
        _offer(
            external_id="due-new",
            status=OfferStatus.NEW,
            next_refresh_at=now - timedelta(minutes=1),
        ),
    )

    offers = repository.find_due_for_refresh(now)

    assert [offer.external_id for offer in offers] == ["due-valid"]


def test_list_filters_by_search_term() -> None:
    repository, _session_factory = _repository()
    flour = _offer(external_id="flour")
    flour.search_term = "flour"
    sugar = _offer(external_id="sugar")
    sugar.search_term = "sugar"
    repository.save(flour)
    repository.save(sugar)

    offers, total = repository.list(None, page=1, size=10, search_term="flour")

    assert total == 1
    assert [offer.external_id for offer in offers] == ["flour"]


def test_provider_identifiers_for_search_term_checks_search_term_and_type() -> None:
    repository, _session_factory = _repository()
    repository.save(_offer(external_id="food", offer_type=OfferType.FOOD))
    decoration = _offer(external_id="decoration", offer_type=OfferType.DECORATION)
    decoration.provider = Provider(
        "Decoration Provider",
        "decoration-provider",
        "https://example.com",
        "123 Street",
    )
    repository.save(decoration)

    assert (
        repository.provider_identifiers_for_search_term("flour", OfferType.FOOD)
        == {"example"}
    )
    assert (
        repository.provider_identifiers_for_search_term(
            "flour",
            OfferType.DECORATION,
        )
        == {"decoration-provider"}
    )
    assert (
        repository.provider_identifiers_for_search_term("sugar", OfferType.FOOD)
        == set()
    )


def test_search_term_facets_count_by_search_term() -> None:
    repository, _session_factory = _repository()
    first_flour = _offer(external_id="flour-1")
    first_flour.search_term = "flour"
    second_flour = _offer(external_id="flour-2")
    second_flour.search_term = "flour"
    sugar = _offer(external_id="sugar")
    sugar.search_term = "sugar"
    repository.save(first_flour)
    repository.save(second_flour)
    repository.save(sugar)

    facets = repository.search_term_facets(offer_type=OfferType.FOOD)

    assert facets == [("flour", 2), ("sugar", 1)]


def test_list_sorts_before_paginating() -> None:
    repository, _session_factory = _repository()
    repository.save(_offer(external_id="expensive", price_amount="9.99"))
    repository.save(_offer(external_id="cheap", price_amount="1.99"))

    offers, total = repository.list(
        None,
        page=1,
        size=1,
        sort_by=OfferSortField.PRICE,
        sort_direction=SortDirection.ASC,
    )

    assert total == EXPECTED_SORT_TOTAL
    assert [offer.external_id for offer in offers] == ["cheap"]


def test_unique_provider_external_id_constraint() -> None:
    repository, _session_factory = _repository()
    repository.save(_offer())

    with pytest.raises(IntegrityError):
        repository.save(_offer())
