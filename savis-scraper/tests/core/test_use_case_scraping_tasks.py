"""Tests for scraping tasks use case."""

# ruff: noqa: D101, D102, D103, D107, S101

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

from app.core.models import ScrapingTask, ScrapingTaskStatus
from app.core.ports import ScrapingTaskRepository
from app.core.use_case_scraping_tasks import (
    STALE_TASK_ERROR_MESSAGE,
    ScrapingTasksUseCase,
)

if TYPE_CHECKING:
    from uuid import UUID

FAILED_COUNT = 3


class FakeScrapingTaskRepository(ScrapingTaskRepository):
    def __init__(self, tasks: list[ScrapingTask] | None = None) -> None:
        self.tasks = tasks or []
        self.statuses: list[ScrapingTaskStatus | None] = []
        self.stale_calls: list[tuple[datetime, str]] = []

    def list(self, status: ScrapingTaskStatus | None = None) -> list[ScrapingTask]:
        self.statuses.append(status)
        return self.tasks

    def save(self, task: ScrapingTask) -> ScrapingTask:
        return task

    def mark_completed(self, task_id: UUID) -> None:  # noqa: ARG002
        return None

    def mark_failed(self, task_id: UUID, error: str) -> None:  # noqa: ARG002
        return None

    def mark_stale_in_progress_as_failed(
        self,
        stale_before: datetime,
        error: str,
    ) -> int:
        self.stale_calls.append((stale_before, error))
        return FAILED_COUNT


def test_list_passes_status_filter_to_repository() -> None:
    task = ScrapingTask.create("flour")
    repository = FakeScrapingTaskRepository([task])
    use_case = ScrapingTasksUseCase(repository)

    tasks = use_case.list(ScrapingTaskStatus.IN_PROGRESS)

    assert tasks == [task]
    assert repository.statuses == [ScrapingTaskStatus.IN_PROGRESS]


def test_mark_stale_tasks_failed_uses_two_hour_cutoff() -> None:
    repository = FakeScrapingTaskRepository()
    use_case = ScrapingTasksUseCase(repository)
    now = datetime(2026, 5, 17, 12, 0, tzinfo=UTC)

    failed_count = use_case.mark_stale_tasks_failed(now=now)

    assert failed_count == FAILED_COUNT
    assert repository.stale_calls == [
        (
            now - timedelta(hours=2),
            STALE_TASK_ERROR_MESSAGE,
        ),
    ]
