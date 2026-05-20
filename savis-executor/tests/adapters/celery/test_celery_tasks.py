"""Tests for Celery task lifecycle."""

# ruff: noqa: D101, D102, D103, D107, S101

from typing import TYPE_CHECKING
from uuid import UUID, uuid7

from app.adapters.celery import celery_tasks
from app.core.models import SavisTaskType

if TYPE_CHECKING:
    import pytest


class FakeTaskRepository:
    def __init__(self) -> None:
        self.failed: list[tuple[UUID, str]] = []

    def mark_failed(self, task_id: UUID, error: str) -> None:
        self.failed.append((task_id, error))


class FakeSavisTaskUseCase:
    def __init__(self, *, fail_get_offers: bool = False) -> None:
        self.fail_get_offers = fail_get_offers
        self.task_repository = FakeTaskRepository()
        self.executions: list[tuple[UUID, SavisTaskType, dict[str, str]]] = []

    def execute_savis_task(
        self,
        task_id: UUID,
        task_type: SavisTaskType,
        payload: dict[str, str],
    ) -> None:
        if self.fail_get_offers:
            msg = "provider timeout"
            raise RuntimeError(msg)
        self.executions.append((task_id, task_type, payload))


def test_get_offers_task_delegates_to_use_case(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid7()
    use_case = FakeSavisTaskUseCase()
    monkeypatch.setattr(celery_tasks, "get_savis_task_use_case", lambda: use_case)

    celery_tasks.get_offers_task.run(str(task_id), "flour", "FOOD")

    assert use_case.executions == [
        (
            task_id,
            SavisTaskType.GET_OFFERS,
            {"search_term": "flour", "offer_type": "FOOD"},
        ),
    ]


def test_refresh_offer_task_delegates_to_use_case(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid7()
    use_case = FakeSavisTaskUseCase()
    monkeypatch.setattr(celery_tasks, "get_savis_task_use_case", lambda: use_case)

    celery_tasks.refresh_offer_task.run(str(task_id), "offer-id", "https://example.com")

    assert use_case.executions == [
        (
            task_id,
            SavisTaskType.REFRESH_OFFER,
            {"offer_id": "offer-id", "url": "https://example.com"},
        ),
    ]


def test_reporting_task_marks_task_failed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid7()
    use_case = FakeSavisTaskUseCase()
    monkeypatch.setattr(celery_tasks, "get_savis_task_use_case", lambda: use_case)

    celery_tasks.ReportingTask().on_failure(
        RuntimeError("provider timeout"),
        "celery-task-id",
        (str(task_id), "flour"),
        {},
        object(),
    )

    assert use_case.task_repository.failed == [(task_id, "provider timeout")]
