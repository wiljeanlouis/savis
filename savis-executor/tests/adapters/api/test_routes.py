"""Tests for executor API routes."""

# ruff: noqa: D103, S101

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import uuid7

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.adapters.api import routes
from app.core.models import (
    Offer,
    OfferSortField,
    OfferStatus,
    OfferType,
    Price,
    Provider,
    SavisTask,
    SavisTaskSortField,
    SavisTaskStatus,
    SavisTaskType,
    SortDirection,
)

if TYPE_CHECKING:
    import pytest

HTTP_OK = 200
HTTP_UNPROCESSABLE_ENTITY = 422
PAGE_TWO = 2
TOTAL_SIX = 6
REFRESH_FREQUENCY_SIX_HOURS = 6


def test_create_task_returns_created_task(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid7()

    class FixedTaskUseCase:
        def enqueue_savis_task(
            self,
            task_type: SavisTaskType,
            payload: dict[str, str],
        ) -> SavisTask:
            task = SavisTask.create(task_type, payload)
            task.id = task_id
            return task

    monkeypatch.setattr(routes, "savis_task_use_case", FixedTaskUseCase())
    app = FastAPI()
    app.include_router(routes.router)
    client = TestClient(app)

    response = client.post(
        "/tasks",
        json={"type": "GET_OFFERS", "payload": {"search_term": "flour"}},
    )

    assert response.status_code == HTTP_OK
    assert response.json() == {
        "id": str(task_id),
        "type": "GET_OFFERS",
        "payload": {"search_term": "flour", "offer_type": "FOOD"},
        "status": "IN_PROGRESS",
        "created_at": response.json()["created_at"],
        "updated_at": response.json()["updated_at"],
        "completed_at": None,
        "error_message": None,
    }


def test_create_task_rejects_payload_missing_required_fields(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FixedTaskUseCase:
        def enqueue_savis_task(
            self,
            task_type: SavisTaskType,  # noqa: ARG002
            payload: dict[str, str],  # noqa: ARG002
        ) -> SavisTask:
            msg = "Should not enqueue invalid task payload"
            raise AssertionError(msg)

    monkeypatch.setattr(routes, "savis_task_use_case", FixedTaskUseCase())
    app = FastAPI()
    app.include_router(routes.router)
    client = TestClient(app)

    response = client.post(
        "/tasks",
        json={"type": "REFRESH_OFFER", "payload": {"offer_id": str(uuid7())}},
    )

    assert response.status_code == HTTP_UNPROCESSABLE_ENTITY
    assert response.json()["detail"][0]["loc"] == [
        "body",
        "REFRESH_OFFER",
        "payload",
        "url",
    ]


def test_list_tasks_filters_by_status_and_type(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task = SavisTask.create(SavisTaskType.GET_OFFERS, {"search_term": "flour"})
    task.status = SavisTaskStatus.FAILED
    task.error_message = "provider timeout"

    class FixedListUseCase:
        def __init__(self) -> None:
            self.filters: list[tuple[SavisTaskStatus | None, SavisTaskType | None]] = []

        def list(
            self,
            status: SavisTaskStatus | None,
            task_type: SavisTaskType | None,
            page: int,
            size: int,
            sort_by: SavisTaskSortField,
            sort_direction: SortDirection,
        ) -> tuple[list[SavisTask], int, int]:
            self.filters.append((status, task_type))
            assert (page, size) == (PAGE_TWO, 5)
            assert sort_by == SavisTaskSortField.STATUS
            assert sort_direction == SortDirection.ASC
            return [task], TOTAL_SIX, PAGE_TWO

    savis_task_use_case = FixedListUseCase()
    monkeypatch.setattr(routes, "savis_task_use_case", savis_task_use_case)
    app = FastAPI()
    app.include_router(routes.router)
    client = TestClient(app)

    response = client.get(
        "/tasks",
        params={
            "status": "FAILED",
            "type": "GET_OFFERS",
            "page": PAGE_TWO,
            "size": 5,
            "sort_by": "status",
            "sort_direction": "asc",
        },
    )

    assert response.status_code == HTTP_OK
    assert response.json() == {
        "items": [
            {
                "id": str(task.id),
                "type": "GET_OFFERS",
                "payload": {"search_term": "flour"},
                "status": "FAILED",
                "created_at": task.created_at.isoformat().replace("+00:00", "Z"),
                "updated_at": task.updated_at.isoformat().replace("+00:00", "Z"),
                "completed_at": None,
                "error_message": "provider timeout",
            },
        ],
        "page": PAGE_TWO,
        "size": 5,
        "total_items": TOTAL_SIX,
        "total_pages": PAGE_TWO,
    }
    assert savis_task_use_case.filters == [
        (SavisTaskStatus.FAILED, SavisTaskType.GET_OFFERS),
    ]


def test_list_offers_returns_paged_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    now = SavisTask.create(
        SavisTaskType.GET_OFFERS,
        {"search_term": "flour"},
    ).created_at
    offer = Offer(
        id=uuid7(),
        external_id="external-id",
        url="https://example.com/offer",
        brand="Example",
        label="Flour",
        price=Price(amount="4.99"),
        package_size=None,
        image_url="https://example.com/image.png",
        provider=Provider("Example", "example", "https://example.com", "123 Street"),
        search_term="flour",
        status=OfferStatus.NEW,
        last_retrieved_at=now,
        next_refresh_at=now,
        refresh_frequency_hours=24,
        last_seen_task_id=uuid7(),
    )

    class FixedOffersUseCase:
        def list(
            self,
            status: OfferStatus | None,
            page: int,
            size: int,
            sort_by: OfferSortField,
            sort_direction: SortDirection,
            offer_type: OfferType | None,
        ) -> tuple[list[Offer], int, int]:
            assert (status, page, size) == (OfferStatus.NEW, PAGE_TWO, 5)
            assert sort_by == OfferSortField.PRICE
            assert sort_direction == SortDirection.DESC
            assert offer_type == OfferType.FOOD
            return [offer], TOTAL_SIX, PAGE_TWO

    monkeypatch.setattr(routes, "offers_use_case", FixedOffersUseCase())
    app = FastAPI()
    app.include_router(routes.router)
    response = TestClient(app).get(
        "/offers",
        params={
            "status": "NEW",
            "page": PAGE_TWO,
            "size": 5,
            "sort_by": "price",
            "sort_direction": "desc",
            "type": "FOOD",
        },
    )

    assert response.status_code == HTTP_OK
    assert response.json()["page"] == PAGE_TWO
    assert response.json()["total_items"] == TOTAL_SIX
    assert response.json()["items"][0]["status"] == "NEW"
    assert response.json()["items"][0]["type"] == "FOOD"


def test_patch_offer_updates_one_offer(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    now = SavisTask.create(
        SavisTaskType.GET_OFFERS,
        {"search_term": "flour"},
    ).created_at
    offer = Offer(
        id=uuid7(),
        external_id="external-id",
        url="https://example.com/offer",
        brand="Example",
        label="Flour",
        price=Price(amount="4.99"),
        package_size=None,
        image_url="https://example.com/image.png",
        provider=Provider("Example", "example", "https://example.com", "123 Street"),
        search_term="flour",
        status=OfferStatus.VALID,
        last_retrieved_at=now,
        next_refresh_at=now,
        refresh_frequency_hours=REFRESH_FREQUENCY_SIX_HOURS,
        last_seen_task_id=uuid7(),
    )

    class FixedOffersUseCase:
        def patch(
            self,
            offer_id: object,
            *,
            status: OfferStatus | None,
            refresh_frequency_hours: int | None,
            refresh_now: bool,
        ) -> Offer:
            assert offer_id == offer.id
            assert status == OfferStatus.VALID
            assert refresh_frequency_hours == REFRESH_FREQUENCY_SIX_HOURS
            assert refresh_now is True
            return offer

    monkeypatch.setattr(routes, "offers_use_case", FixedOffersUseCase())
    app = FastAPI()
    app.include_router(routes.router)

    response = TestClient(app).patch(
        f"/offers/{offer.id}",
        json={
            "status": "VALID",
            "refresh_frequency_hours": REFRESH_FREQUENCY_SIX_HOURS,
            "refresh_now": True,
        },
    )

    assert response.status_code == HTTP_OK
    assert response.json()["status"] == "VALID"
    assert (
        response.json()["refresh_frequency_hours"]
        == REFRESH_FREQUENCY_SIX_HOURS
    )
