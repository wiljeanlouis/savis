"""Domain models module."""

from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid7


class ScrapingTaskStatus(StrEnum):
    """Possible statuses for a scraping task."""

    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class OfferStatus(StrEnum):
    """Human review status for a scraped offer."""

    NEW = "NEW"
    VALID = "VALID"
    REJECTED = "REJECTED"


@dataclass
class ScrapingTask:
    """Represents the lifecycle of a scraping request owned by Python."""

    search_term: str
    id: UUID
    status: ScrapingTaskStatus
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None
    error_message: str | None = None

    @classmethod
    def create(cls, search_term: str) -> ScrapingTask:
        """Create a new scraping task already marked as in progress."""
        now = datetime.now(UTC)
        return cls(
            id=uuid7(),
            search_term=search_term,
            status=ScrapingTaskStatus.IN_PROGRESS,
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


@dataclass
class Provider:
    """Represents the provider of a product offer."""

    name: str
    identifier: str
    site: str
    address: str


@dataclass
class Offer:
    """Represents a product offer with pricing and provider details.

    Attributes
    ----------
    external_id : str
        The external identifier for the offer.
    url : str
        The URL of the offer.
    brand : str
        The brand of the product.
    label : str
        The label or name of the product.
    price : Price
        The total price
    package_size : PackageSize
        The total amount of the product
    image_url : str
        The URL of the product image.
    provider: str
        The provider

    """

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
    last_scraped_at: datetime | None = None
    next_refresh_at: datetime | None = None
    refresh_frequency_hours: int | None = None
    last_seen_task_id: UUID | None = None
