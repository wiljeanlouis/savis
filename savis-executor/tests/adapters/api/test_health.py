"""Tests for executor health endpoints."""

# ruff: noqa: D103, S101

from typing import TYPE_CHECKING

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.adapters.api import health

if TYPE_CHECKING:
    import pytest

HTTP_OK = 200
HTTP_SERVICE_UNAVAILABLE = 503


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(health.router)
    return TestClient(app)


def test_liveness_does_not_probe_dependencies() -> None:
    response = _client().get("/health/live")

    assert response.status_code == HTTP_OK
    assert response.json() == {"status": "UP"}


def test_readiness_reports_available_dependencies(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(health, "check_database", lambda: None)
    monkeypatch.setattr(health, "check_rabbitmq", lambda: None)

    response = _client().get("/health")

    assert response.status_code == HTTP_OK
    assert response.json() == {"status": "UP"}


def test_readiness_fails_when_a_dependency_is_unavailable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def unavailable() -> None:
        raise ConnectionError

    monkeypatch.setattr(health, "check_database", unavailable)

    response = _client().get("/health")

    assert response.status_code == HTTP_SERVICE_UNAVAILABLE
