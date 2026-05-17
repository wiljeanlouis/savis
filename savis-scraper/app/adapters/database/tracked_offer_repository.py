"""SQLAlchemy repository for tracked offers."""

from __future__ import annotations

from datetime import datetime  # noqa: TC003
from decimal import Decimal  # noqa: TC003
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, Integer, Numeric, String, UniqueConstraint, select
from sqlalchemy.orm import Mapped, Session, mapped_column, sessionmaker

from app.adapters.database.session import Base, SessionLocal, create_database_schema
from app.core.models import TrackedOffer
from app.core.ports import TrackedOfferRepository

if TYPE_CHECKING:
    from collections.abc import Callable


class TrackedOfferEntity(Base):
    """Database representation of an offer tracked for refresh."""

    __tablename__ = "tracked_offers"
    __table_args__ = (
        UniqueConstraint(
            "provider",
            "external_id",
            name="uq_tracked_offers_provider_external_id",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    provider: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    search_term: Mapped[str] = mapped_column(String(255), nullable=False)
    last_known_price: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 4),
        nullable=True,
    )
    last_scraped_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    next_refresh_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    refresh_frequency_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    last_seen_task_id: Mapped[str] = mapped_column(String(36), nullable=False)


def _to_entity(tracked_offer: TrackedOffer) -> TrackedOfferEntity:
    return TrackedOfferEntity(
        id=str(tracked_offer.id),
        provider=tracked_offer.provider,
        url=tracked_offer.url,
        external_id=tracked_offer.external_id,
        search_term=tracked_offer.search_term,
        last_known_price=tracked_offer.last_known_price,
        last_scraped_at=tracked_offer.last_scraped_at,
        next_refresh_at=tracked_offer.next_refresh_at,
        refresh_frequency_hours=tracked_offer.refresh_frequency_hours,
        last_seen_task_id=str(tracked_offer.last_seen_task_id),
    )


def _to_model(entity: TrackedOfferEntity) -> TrackedOffer:
    return TrackedOffer(
        id=UUID(entity.id),
        provider=entity.provider,
        url=entity.url,
        external_id=entity.external_id,
        search_term=entity.search_term,
        last_known_price=entity.last_known_price,
        last_scraped_at=entity.last_scraped_at,
        next_refresh_at=entity.next_refresh_at,
        refresh_frequency_hours=entity.refresh_frequency_hours,
        last_seen_task_id=UUID(entity.last_seen_task_id),
    )


class SqlAlchemyTrackedOfferRepository(TrackedOfferRepository):
    """Persist tracked offers with SQLAlchemy."""

    def __init__(
        self,
        session_factory: sessionmaker[Session] = SessionLocal,
        schema_creator: Callable[[], None] = create_database_schema,
    ) -> None:
        """Initialize the repository."""
        self.session_factory = session_factory
        self.schema_creator = schema_creator

    def find_by_provider_and_external_id(
        self,
        provider: str,
        external_id: str,
    ) -> TrackedOffer | None:
        """Find a tracked offer by provider identity."""
        self.schema_creator()
        statement = select(TrackedOfferEntity).where(
            TrackedOfferEntity.provider == provider,
            TrackedOfferEntity.external_id == external_id,
        )
        with self.session_factory() as session:
            entity = session.scalar(statement)
            return None if entity is None else _to_model(entity)

    def save(self, tracked_offer: TrackedOffer) -> TrackedOffer:
        """Save a tracked offer."""
        self.schema_creator()
        with self.session_factory() as session:
            session.merge(_to_entity(tracked_offer))
            session.commit()
            return tracked_offer
