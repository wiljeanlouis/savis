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
from app.core.models import Offer, OfferSortField, OfferStatus, Price, Provider
from app.core.models import SortDirection


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
        last_retrieved_at=now,
        next_refresh_at=now + timedelta(hours=24),
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


def test_list_filters_and_paginates() -> None:
    repository, _session_factory = _repository()
    repository.save(_offer(external_id="a", status=OfferStatus.NEW))
    repository.save(_offer(external_id="b", status=OfferStatus.VALID))

    offers, total = repository.list(OfferStatus.VALID, page=1, size=10)

    assert total == 1
    assert [offer.external_id for offer in offers] == ["b"]


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

    assert total == 2
    assert [offer.external_id for offer in offers] == ["cheap"]


def test_unique_provider_external_id_constraint() -> None:
    repository, _session_factory = _repository()
    repository.save(_offer())

    with pytest.raises(IntegrityError):
        repository.save(_offer())
