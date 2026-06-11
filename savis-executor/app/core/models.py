"""Domain models module."""

from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid7


class SavisTaskStatus(StrEnum):
    """Possible statuses for an executor task."""

    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class SavisTaskType(StrEnum):
    """Supported executor task types."""

    GET_OFFERS = "GET_OFFERS"
    GET_OFFER = "GET_OFFER"
    REFRESH_OFFER = "REFRESH_OFFER"


class SortDirection(StrEnum):
    """Supported list sort directions."""

    ASC = "asc"
    DESC = "desc"


class SavisTaskSortField(StrEnum):
    """Sortable executor task fields."""

    TYPE = "type"
    STATUS = "status"
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    COMPLETED_AT = "completed_at"


@dataclass
class SavisTask:
    """Represents the lifecycle of a task owned by the executor."""

    type: SavisTaskType
    payload: dict[str, str]
    id: UUID
    status: SavisTaskStatus
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None
    error_message: str | None = None

    @classmethod
    def create(cls, task_type: SavisTaskType, payload: dict[str, str]) -> SavisTask:
        """Create a new task already marked as in progress."""
        now = datetime.now(UTC)
        return cls(
            id=uuid7(),
            type=task_type,
            payload=payload,
            status=SavisTaskStatus.IN_PROGRESS,
            created_at=now,
            updated_at=now,
        )


@dataclass
class PackageSize:
    """Represents the size of a product package."""

    value: float
    unit: str


@dataclass
class Price:
    """Represents the price of a product offer."""

    amount: str
    currency: str = "CAD"


class ProviderName(StrEnum):
    """Represents the provider name."""

    MAXI = "Maxi"


@dataclass
class Provider:
    """Represents the provider of a product offer."""

    name: str
    identifier: str
    site: str
    address: str


class OfferStatus(StrEnum):
    """Human review status for a retrieved offer."""

    NEW = "NEW"
    VALID = "VALID"
    REJECTED = "REJECTED"


class OfferType(StrEnum):
    """Business type for a retrieved offer."""

    FOOD = "FOOD"
    MATERIAL = "MATERIAL"


class OfferSortField(StrEnum):
    """Sortable offer fields."""

    LABEL = "label"
    BRAND = "brand"
    PRICE = "price"
    PACKAGE_SIZE = "package_size"
    PROVIDER = "provider"
    SEARCH_TERM = "search_term"
    STATUS = "status"
    LAST_RETRIEVED_AT = "last_retrieved_at"
    NEXT_REFRESH_AT = "next_refresh_at"


@dataclass
class Offer:
    """Represents a product offer with pricing and provider details."""

    external_id: str
    url: str
    brand: str
    label: str
    price: Price | None
    package_size: PackageSize | None
    image_url: str
    provider: Provider
    id: UUID | None = None
    search_term: str | None = None
    status: OfferStatus | None = None
    last_retrieved_at: datetime | None = None
    next_refresh_at: datetime | None = None
    refresh_frequency_hours: int | None = None
    last_seen_task_id: UUID | None = None
    offer_type: OfferType = OfferType.FOOD
