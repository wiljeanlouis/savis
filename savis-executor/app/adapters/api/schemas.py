"""Schema definitions for executor API payloads."""

from datetime import datetime  # noqa: TC003
from typing import Annotated, Literal
from uuid import UUID  # noqa: TC003

from pydantic import BaseModel, Field

from app.core.models import (  # noqa: TC001
    OfferStatus,
    OfferType,
    SavisTaskStatus,
    SavisTaskType,
)


class GetOffersPayload(BaseModel):
    """Payload for collecting offers matching a search term."""

    search_term: str = Field(
        examples=["farine"],
        min_length=1,
    )
    offer_type: OfferType = Field(
        default=OfferType.FOOD,
        validation_alias="type",
        serialization_alias="type",
    )


class RefreshOfferPayload(BaseModel):
    """Payload for refreshing a known offer by URL."""

    offer_id: UUID
    url: str = Field(
        examples=["https://www.maxi.ca/example-offer/p/12345"],
        min_length=1,
    )


class GetOffersTaskRequest(BaseModel):
    """Schema for GET_OFFERS task creation."""

    type: Literal[SavisTaskType.GET_OFFERS]
    payload: GetOffersPayload


class RefreshOfferTaskRequest(BaseModel):
    """Schema for REFRESH_OFFER task creation."""

    type: Literal[SavisTaskType.REFRESH_OFFER]
    payload: RefreshOfferPayload


SavisTaskRequest = Annotated[
    GetOffersTaskRequest | RefreshOfferTaskRequest,
    Field(discriminator="type"),
]


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
    type: OfferType
    last_retrieved_at: datetime
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


class SearchTermFacetResponse(BaseModel):
    """Schema for one search-term facet."""

    search_term: str
    count: int


class PatchOfferRequest(BaseModel):
    """Schema for human offer updates."""

    status: OfferStatus | None = None
    refresh_frequency_hours: int | None = Field(default=None, ge=1)
    refresh_now: bool = False
