"""Tests for SQLAlchemy tracked offer repository."""

# ruff: noqa: D103, S101

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid7

import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.adapters.database.session import Base
from app.adapters.database.tracked_offer_repository import (
    SqlAlchemyTrackedOfferRepository,
    TrackedOfferEntity,
)
from app.core.models import TrackedOffer


def _repository() -> tuple[
    SqlAlchemyTrackedOfferRepository,
    sessionmaker[Session],
]:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    return (
        SqlAlchemyTrackedOfferRepository(
            session_factory=session_factory,
            schema_creator=lambda: None,
        ),
        session_factory,
    )


def _tracked_offer(
    *,
    url: str = "https://example.com/offer",
    amount: Decimal | None = Decimal("4.99"),
    task_id: UUID | None = None,
) -> TrackedOffer:
    now = datetime(2026, 5, 17, 12, 0, tzinfo=UTC)
    return TrackedOffer(
        id=uuid7(),
        provider="example",
        url=url,
        external_id="external-id",
        search_term="flour",
        last_known_price=amount,
        last_scraped_at=now,
        next_refresh_at=now + timedelta(hours=24),
        refresh_frequency_hours=24,
        last_seen_task_id=uuid7() if task_id is None else task_id,
    )


def test_save_persists_tracked_offer_fields() -> None:
    repository, session_factory = _repository()
    tracked_offer = _tracked_offer()

    repository.save(tracked_offer)

    with session_factory() as session:
        entity = session.get(TrackedOfferEntity, str(tracked_offer.id))

    assert entity is not None
    assert entity.provider == "example"
    assert entity.url == "https://example.com/offer"
    assert entity.external_id == "external-id"
    assert entity.search_term == "flour"
    assert entity.last_known_price == Decimal("4.9900")
    assert entity.last_seen_task_id == str(tracked_offer.last_seen_task_id)


def test_find_by_provider_and_external_id_returns_tracked_offer() -> None:
    repository, _session_factory = _repository()
    tracked_offer = repository.save(_tracked_offer())

    found = repository.find_by_provider_and_external_id("example", "external-id")

    assert found is not None
    assert found.id == tracked_offer.id


def test_save_updates_existing_tracked_offer() -> None:
    repository, session_factory = _repository()
    tracked_offer = repository.save(_tracked_offer())
    tracked_offer.url = "https://example.com/new-offer"
    tracked_offer.last_known_price = Decimal("5.99")
    tracked_offer.last_seen_task_id = uuid7()

    repository.save(tracked_offer)

    with session_factory() as session:
        entities = session.query(TrackedOfferEntity).all()

    assert len(entities) == 1
    assert entities[0].url == "https://example.com/new-offer"
    assert entities[0].last_known_price == Decimal("5.9900")
    assert entities[0].last_seen_task_id == str(tracked_offer.last_seen_task_id)


def test_unique_provider_external_id_constraint_rejects_duplicates() -> None:
    repository, _session_factory = _repository()
    repository.save(_tracked_offer())
    duplicate = _tracked_offer(url="https://example.com/another-offer")

    with pytest.raises(IntegrityError):
        repository.save(duplicate)
