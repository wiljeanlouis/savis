"""Schema definitions for scraping API payloads."""

from datetime import datetime  # noqa: TC003

from pydantic import BaseModel, Field

from app.core.models import OfferStatus, ScrapingTaskStatus  # noqa: TC001


class ScrapeRequest(BaseModel):
    """Schema for scrape request payload."""

    search_term: str


class ScrapeResponse(BaseModel):
    """Schema for scrape operation response.

    Attributes:
        status: The status of the scrape operation.
        id: The unique identifier for the scrape operation.

    """

    status: str
    search_term: str
    task_id: str


class ScrapingTaskResponse(BaseModel):
    """Schema for a scraping task response."""

    id: str
    search_term: str
    status: ScrapingTaskStatus
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    error_message: str | None


class PriceResponse(BaseModel):
    """Schema for an offer price."""

    amount: str
    currency: str


class PackageSizeResponse(BaseModel):
    """Schema for an offer package size."""

    value: float
    unit: str


class ProviderResponse(BaseModel):
    """Schema for an offer provider."""

    name: str
    identifier: str
    site: str
    address: str


class OfferResponse(BaseModel):
    """Schema for a persisted offer."""

    id: str
    external_id: str
    url: str
    brand: str
    label: str
    price: PriceResponse | None
    package_size: PackageSizeResponse | None
    image_url: str
    provider: ProviderResponse
    search_term: str
    status: OfferStatus
    last_scraped_at: datetime
    next_refresh_at: datetime
    refresh_frequency_hours: int
    last_seen_task_id: str


class OffersPageResponse(BaseModel):
    """Schema for a paginated offer listing."""

    items: list[OfferResponse]
    page: int
    size: int
    total_items: int
    total_pages: int


class PatchOfferRequest(BaseModel):
    """Schema for human offer updates."""

    status: OfferStatus | None = None
    refresh_frequency_hours: int | None = Field(default=None, ge=1)
    refresh_now: bool = False
