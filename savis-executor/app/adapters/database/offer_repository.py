"""SQLAlchemy repository for offers."""

from __future__ import annotations

from datetime import datetime  # noqa: TC003
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    DateTime,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
    select,
)
from sqlalchemy.orm import Mapped, Session, mapped_column, sessionmaker

from app.adapters.database.session import Base, SessionLocal
from app.core.models import (
    Offer,
    OfferSortField,
    OfferStatus,
    OfferType,
    PackageSize,
    Price,
    Provider,
    SortDirection,
)
from app.core.ports import OfferRepository


class OfferEntity(Base):
    """Database representation of an offer."""

    __tablename__ = "offers"
    __table_args__ = (
        UniqueConstraint(
            "provider_identifier",
            "external_id",
            name="uq_offers_provider_external_id",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    brand: Mapped[str] = mapped_column(String(255), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    price_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    price_currency: Mapped[str | None] = mapped_column(String(8), nullable=True)
    package_size_value: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 4),
        nullable=True,
    )
    package_size_unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    image_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_identifier: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_site: Mapped[str] = mapped_column(String(2048), nullable=False)
    provider_address: Mapped[str] = mapped_column(String(1024), nullable=False)
    search_term: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    offer_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=OfferType.FOOD.value,
        server_default=OfferType.FOOD.value,
    )
    last_retrieved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    next_refresh_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    refresh_frequency_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    last_seen_task_id: Mapped[str] = mapped_column(String(36), nullable=False)


def _to_entity(offer: Offer) -> OfferEntity:
    if (
        offer.id is None
        or offer.search_term is None
        or offer.status is None
        or offer.last_retrieved_at is None
        or offer.next_refresh_at is None
        or offer.refresh_frequency_hours is None
        or offer.last_seen_task_id is None
    ):
        msg = "Only tracked offers can be persisted"
        raise ValueError(msg)

    return OfferEntity(
        id=str(offer.id),
        external_id=offer.external_id,
        url=offer.url,
        brand=offer.brand,
        label=offer.label,
        price_amount=None if offer.price is None else Decimal(offer.price.amount),
        price_currency=None if offer.price is None else offer.price.currency,
        package_size_value=(
            None
            if offer.package_size is None
            else Decimal(str(offer.package_size.value))
        ),
        package_size_unit=(
            None if offer.package_size is None else offer.package_size.unit
        ),
        image_url=offer.image_url,
        provider_name=offer.provider.name,
        provider_identifier=offer.provider.identifier,
        provider_site=offer.provider.site,
        provider_address=offer.provider.address,
        search_term=offer.search_term,
        status=offer.status.value,
        offer_type=offer.offer_type.value,
        last_retrieved_at=offer.last_retrieved_at,
        next_refresh_at=offer.next_refresh_at,
        refresh_frequency_hours=offer.refresh_frequency_hours,
        last_seen_task_id=str(offer.last_seen_task_id),
    )


def _to_model(entity: OfferEntity) -> Offer:
    return Offer(
        id=UUID(entity.id),
        external_id=entity.external_id,
        url=entity.url,
        brand=entity.brand,
        label=entity.label,
        price=(
            None
            if entity.price_amount is None or entity.price_currency is None
            else Price(
                amount=format(entity.price_amount, ".2f"),
                currency=entity.price_currency,
            )
        ),
        package_size=(
            None
            if entity.package_size_value is None or entity.package_size_unit is None
            else PackageSize(
                value=float(entity.package_size_value),
                unit=entity.package_size_unit,
            )
        ),
        image_url=entity.image_url,
        provider=Provider(
            name=entity.provider_name,
            identifier=entity.provider_identifier,
            site=entity.provider_site,
            address=entity.provider_address,
        ),
        search_term=entity.search_term,
        status=OfferStatus(entity.status),
        offer_type=OfferType(entity.offer_type),
        last_retrieved_at=entity.last_retrieved_at,
        next_refresh_at=entity.next_refresh_at,
        refresh_frequency_hours=entity.refresh_frequency_hours,
        last_seen_task_id=UUID(entity.last_seen_task_id),
    )


class SqlAlchemyOfferRepository(OfferRepository):
    """Persist offers with SQLAlchemy."""

    def __init__(
        self,
        session_factory: sessionmaker[Session] = SessionLocal,
    ) -> None:
        """Initialize the repository."""
        self.session_factory = session_factory

    def find_by_provider_and_external_id(
        self,
        provider: str,
        external_id: str,
    ) -> Offer | None:
        """Find an offer by provider identity."""
        statement = select(OfferEntity).where(
            OfferEntity.provider_identifier == provider,
            OfferEntity.external_id == external_id,
        )
        with self.session_factory() as session:
            entity = session.scalar(statement)
            return None if entity is None else _to_model(entity)

    def find_by_id(self, offer_id: UUID) -> Offer | None:
        """Find an offer by id."""
        with self.session_factory() as session:
            entity = session.get(OfferEntity, str(offer_id))
            return None if entity is None else _to_model(entity)

    def list(  # noqa: PLR0913
        self,
        status: OfferStatus | None,
        page: int,
        size: int,
        sort_by: OfferSortField = OfferSortField.LAST_RETRIEVED_AT,
        sort_direction: SortDirection = SortDirection.DESC,
        offer_type: OfferType | None = None,
        search_term: str | None = None,
    ) -> tuple[list[Offer], int]:
        """List paged offers and total count."""
        sort_column = {
            OfferSortField.LABEL: OfferEntity.label,
            OfferSortField.BRAND: OfferEntity.brand,
            OfferSortField.PRICE: OfferEntity.price_amount,
            OfferSortField.PACKAGE_SIZE: OfferEntity.package_size_value,
            OfferSortField.PROVIDER: OfferEntity.provider_name,
            OfferSortField.SEARCH_TERM: OfferEntity.search_term,
            OfferSortField.STATUS: OfferEntity.status,
            OfferSortField.LAST_RETRIEVED_AT: OfferEntity.last_retrieved_at,
            OfferSortField.NEXT_REFRESH_AT: OfferEntity.next_refresh_at,
        }[sort_by]
        sort_expression = (
            sort_column.asc()
            if sort_direction == SortDirection.ASC
            else sort_column.desc()
        )
        statement = select(OfferEntity).order_by(sort_expression)
        count_statement = select(func.count()).select_from(OfferEntity)
        if status is not None:
            statement = statement.where(OfferEntity.status == status.value)
            count_statement = count_statement.where(OfferEntity.status == status.value)
        if offer_type is not None:
            statement = statement.where(OfferEntity.offer_type == offer_type.value)
            count_statement = count_statement.where(
                OfferEntity.offer_type == offer_type.value,
            )
        if search_term is not None:
            statement = statement.where(OfferEntity.search_term == search_term)
            count_statement = count_statement.where(
                OfferEntity.search_term == search_term,
            )

        with self.session_factory() as session:
            total = session.scalar(count_statement) or 0
            entities = session.scalars(
                statement.offset((page - 1) * size).limit(size),
            ).all()
            return [_to_model(entity) for entity in entities], total

    def search_term_facets(
        self,
        status: OfferStatus | None = None,
        offer_type: OfferType | None = None,
    ) -> list[tuple[str, int]]:
        """Count offers grouped by search term."""
        statement = (
            select(OfferEntity.search_term, func.count())
            .group_by(OfferEntity.search_term)
            .order_by(func.count().desc(), OfferEntity.search_term.asc())
        )
        if status is not None:
            statement = statement.where(OfferEntity.status == status.value)
        if offer_type is not None:
            statement = statement.where(OfferEntity.offer_type == offer_type.value)

        with self.session_factory() as session:
            return [
                (search_term, count)
                for search_term, count in session.execute(statement)
            ]

    def find_due_for_refresh(self, now: datetime) -> list[Offer]:
        """Find valid offers whose next refresh date is due."""
        statement = (
            select(OfferEntity)
            .where(
                OfferEntity.status == OfferStatus.VALID.value,
                OfferEntity.next_refresh_at <= now,
            )
            .order_by(OfferEntity.next_refresh_at.asc(), OfferEntity.id.asc())
        )
        with self.session_factory() as session:
            return [_to_model(entity) for entity in session.scalars(statement).all()]

    def provider_identifiers_for_search_term(
        self,
        search_term: str,
        offer_type: OfferType,
    ) -> set[str]:
        """Return provider identifiers with offers for a search term and type."""
        statement = (
            select(OfferEntity.provider_identifier)
            .where(
                OfferEntity.search_term == search_term,
                OfferEntity.offer_type == offer_type.value,
            )
            .distinct()
        )
        with self.session_factory() as session:
            return set(session.scalars(statement).all())

    def save(self, offer: Offer) -> Offer:
        """Save an offer."""
        with self.session_factory() as session:
            session.merge(_to_entity(offer))
            session.commit()
            return offer

    def delete(self, offer_id: UUID) -> bool:
        """Delete an offer."""
        with self.session_factory() as session:
            entity = session.get(OfferEntity, str(offer_id))
            if entity is None:
                return False
            session.delete(entity)
            session.commit()
            return True
