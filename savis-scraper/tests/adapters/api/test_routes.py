"""Tests for scraper API routes."""

# ruff: noqa: D103, S101

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import uuid7

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.adapters.api import routes
from app.core.models import (
    Offer,
    OfferStatus,
    Price,
    Provider,
    ScrapingTask,
    ScrapingTaskStatus,
)

if TYPE_CHECKING:
    import pytest

HTTP_OK = 200
PAGE_TWO = 2
TOTAL_SIX = 6
REFRESH_FREQUENCY_SIX_HOURS = 6


def test_scrape_offers_returns_created_task_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid7()

    class FixedTaskUseCase:
        def scrape_offers(self, term: str) -> ScrapingTask:
            task = ScrapingTask.create(term)
            task.id = task_id
            return task

    monkeypatch.setattr(routes, "enqueue_use_case", FixedTaskUseCase())
    app = FastAPI()
    app.include_router(routes.router)
    client = TestClient(app)

    response = client.post("/scrape/offers", json={"search_term": "flour"})

    assert response.status_code == HTTP_OK
    assert response.json() == {
        "status": "accepted",
        "search_term": "flour",
        "task_id": str(task_id),
    }


def test_list_scraping_tasks_filters_by_status(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task = ScrapingTask.create("flour")
    task.status = ScrapingTaskStatus.FAILED
    task.error_message = "provider timeout"

    class FixedListUseCase:
        def __init__(self) -> None:
            self.statuses: list[ScrapingTaskStatus | None] = []

        def list(self, status: ScrapingTaskStatus | None) -> list[ScrapingTask]:
            self.statuses.append(status)
            return [task]

    scraping_tasks_use_case = FixedListUseCase()
    monkeypatch.setattr(routes, "scraping_tasks_use_case", scraping_tasks_use_case)
    app = FastAPI()
    app.include_router(routes.router)
    client = TestClient(app)

    response = client.get("/scrape/tasks", params={"status": "FAILED"})

    assert response.status_code == HTTP_OK
    assert response.json() == [
        {
            "id": str(task.id),
            "search_term": "flour",
            "status": "FAILED",
            "created_at": task.created_at.isoformat().replace("+00:00", "Z"),
            "updated_at": task.updated_at.isoformat().replace("+00:00", "Z"),
            "completed_at": None,
            "error_message": "provider timeout",
        },
    ]
    assert scraping_tasks_use_case.statuses == [ScrapingTaskStatus.FAILED]


def test_list_offers_returns_paged_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    now = ScrapingTask.create("flour").created_at
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
        last_scraped_at=now,
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
        ) -> tuple[list[Offer], int, int]:
            assert (status, page, size) == (OfferStatus.NEW, PAGE_TWO, 5)
            return [offer], TOTAL_SIX, PAGE_TWO

    monkeypatch.setattr(routes, "offers_use_case", FixedOffersUseCase())
    app = FastAPI()
    app.include_router(routes.router)
    response = TestClient(app).get(
        "/offers",
        params={"status": "NEW", "page": PAGE_TWO, "size": 5},
    )

    assert response.status_code == HTTP_OK
    assert response.json()["page"] == PAGE_TWO
    assert response.json()["total_items"] == TOTAL_SIX
    assert response.json()["items"][0]["status"] == "NEW"


def test_patch_offer_updates_one_offer(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    now = ScrapingTask.create("flour").created_at
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
        last_scraped_at=now,
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
