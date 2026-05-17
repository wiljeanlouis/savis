"""Tests for scraper API routes."""

# ruff: noqa: D103, S101

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.adapters.api import routes
from app.core.models import ScrapingTask

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

    monkeypatch.setattr(routes, "use_case", FixedTaskUseCase())
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
