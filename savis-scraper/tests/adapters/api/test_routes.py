"""Tests for scraper API routes."""

# ruff: noqa: D103, S101

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.adapters.api import routes
from app.core.models import ScrapingTask, ScrapingTaskStatus

if TYPE_CHECKING:
    import pytest

HTTP_OK = 200


def test_scrape_offers_returns_created_task_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid4()

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
