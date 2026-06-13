"""Tests for Celery task lifecycle."""

# ruff: noqa: D101, D102, D103, D107, S101

from typing import TYPE_CHECKING
from uuid import UUID, uuid7

from app.adapters.celery import celery_tasks
from app.core.models import SavisTaskType
from app.core.ports import OfferProviderNonRetryableError

if TYPE_CHECKING:
    import pytest

SCHEDULED_REFRESH_COUNT = 2
STALE_TASK_COUNT = 3


def test_scraping_tasks_do_not_retry_maxi_block_errors() -> None:
    scraping_tasks = (
        celery_tasks.get_offer_task,
        celery_tasks.get_offers_task,
        celery_tasks.refresh_offer_task,
    )

    for task in scraping_tasks:
        assert OfferProviderNonRetryableError in task.dont_autoretry_for


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
        self.scheduled_refresh_count = 0
        self.stale_task_cleanup_count = 0

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

    def enqueue_due_offer_refresh_tasks(self) -> list[object]:
        self.scheduled_refresh_count += 1
        return [object() for _ in range(SCHEDULED_REFRESH_COUNT)]

    def mark_stale_tasks_failed(self) -> int:
        self.stale_task_cleanup_count += 1
        return STALE_TASK_COUNT


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


def test_schedule_due_offer_refresh_tasks_delegates_to_use_case(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    use_case = FakeSavisTaskUseCase()
    monkeypatch.setattr(celery_tasks, "get_savis_task_use_case", lambda: use_case)

    scheduled_count = celery_tasks.schedule_due_offer_refresh_tasks.run()

    assert scheduled_count == SCHEDULED_REFRESH_COUNT
    assert use_case.scheduled_refresh_count == 1


def test_cleanup_stale_savis_tasks_delegates_to_use_case(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    use_case = FakeSavisTaskUseCase()
    monkeypatch.setattr(celery_tasks, "get_savis_task_use_case", lambda: use_case)

    failed_count = celery_tasks.cleanup_stale_savis_tasks.run()

    assert failed_count == STALE_TASK_COUNT
    assert use_case.stale_task_cleanup_count == 1


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
