"""Schema definitions for scraping API payloads."""

from datetime import datetime  # noqa: TC003

from pydantic import BaseModel, Field

from app.core.models import OfferStatus, SavisTaskStatus, SavisTaskType  # noqa: TC001


class SavisTaskRequest(BaseModel):
    """Schema for task creation."""

    type: SavisTaskType
    payload: dict[str, str]


class SavisTaskResponse(BaseModel):
    """Schema for a task response."""

    id: str
    type: SavisTaskType
    payload: dict[str, str]
    status: SavisTaskStatus
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    error_message: str | None


class SavisTasksPageResponse(BaseModel):
    """Schema for a paginated task listing."""

    items: list[SavisTaskResponse]
    page: int
    size: int
    total_items: int
    total_pages: int


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
