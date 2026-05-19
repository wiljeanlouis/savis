"""API routes for scraping tasks and offers."""

from typing import Annotated
from uuid import UUID  # noqa: TC003

from fastapi import APIRouter, HTTPException, Query

from app.adapters.api.schemas import (
    OfferResponse,
    OffersPageResponse,
    PackageSizeResponse,
    PatchOfferRequest,
    PriceResponse,
    ProviderResponse,
    SavisTaskRequest,
    SavisTaskResponse,
    SavisTasksPageResponse,
)
from app.container import Container
from app.core.models import (
    Offer,
    OfferStatus,
    SavisTask,
    SavisTaskStatus,
    SavisTaskType,
)

router = APIRouter()
savis_task_use_case = Container.savis_task_use_case()
offers_use_case = Container.offers_use_case()


@router.post("/tasks")
async def create_task(request: SavisTaskRequest) -> SavisTaskResponse:
    """Enqueue a task."""
    return _task_response(
        savis_task_use_case.enqueue_savis_task(
            request.type,
            request.payload.model_dump(mode="json"),
        ),
    )


@router.get("/tasks")
async def list_tasks(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1)] = 20,
    status: SavisTaskStatus | None = None,
    task_type: Annotated[SavisTaskType | None, Query(alias="type")] = None,
) -> SavisTasksPageResponse:
    """List paginated tasks, optionally filtered by status and type."""
    tasks, total_items, total_pages = savis_task_use_case.list(
        status,
        task_type,
        page,
        size,
    )
    return SavisTasksPageResponse(
        items=[_task_response(task) for task in tasks],
        page=page,
        size=size,
        total_items=total_items,
        total_pages=total_pages,
    )


@router.get("/offers")
async def list_offers(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1)] = 20,
    status: OfferStatus | None = None,
) -> OffersPageResponse:
    """List paginated offers, optionally filtered by status."""
    offers, total_items, total_pages = offers_use_case.list(status, page, size)
    return OffersPageResponse(
        items=[_offer_response(offer) for offer in offers],
        page=page,
        size=size,
        total_items=total_items,
        total_pages=total_pages,
    )


@router.patch("/offers/{offer_id}")
async def patch_offer(
    offer_id: UUID,
    request: PatchOfferRequest,
) -> OfferResponse:
    """Update one offer after human review."""
    offer = offers_use_case.patch(
        offer_id,
        status=request.status,
        refresh_frequency_hours=request.refresh_frequency_hours,
        refresh_now=request.refresh_now,
    )
    if offer is None:
        raise HTTPException(status_code=404, detail="Offer not found")
    return _offer_response(offer)


def _offer_response(offer: Offer) -> OfferResponse:
    return OfferResponse(
        id=str(offer.id),
        external_id=offer.external_id,
        url=offer.url,
        brand=offer.brand,
        label=offer.label,
        price=None
        if offer.price is None
        else PriceResponse(amount=offer.price.amount, currency=offer.price.currency),
        package_size=None
        if offer.package_size is None
        else PackageSizeResponse(
            value=offer.package_size.value,
            unit=offer.package_size.unit,
        ),
        image_url=offer.image_url,
        provider=ProviderResponse(
            name=offer.provider.name,
            identifier=offer.provider.identifier,
            site=offer.provider.site,
            address=offer.provider.address,
        ),
        search_term=offer.search_term or "",
        status=offer.status or OfferStatus.NEW,
        last_scraped_at=offer.last_scraped_at,  # pyright: ignore[reportArgumentType]
        next_refresh_at=offer.next_refresh_at,  # pyright: ignore[reportArgumentType]
        refresh_frequency_hours=offer.refresh_frequency_hours or 24,
        last_seen_task_id=str(offer.last_seen_task_id),
    )


def _task_response(task: SavisTask) -> SavisTaskResponse:
    return SavisTaskResponse(
        id=str(task.id),
        type=task.type,
        payload=task.payload,
        status=task.status,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at,
        error_message=task.error_message,
    )
