"""Tests for cleanup scraping task use case."""

# ruff: noqa: D101, D102, D103, D107, S101

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

from app.core.cleanup_scraping_tasks_use_case import (
    STALE_TASK_ERROR_MESSAGE,
    CleanupScrapingTasksUseCase,
)
from app.core.ports import ScrapingTaskRepository

if TYPE_CHECKING:
    from uuid import UUID

    from app.core.models import ScrapingTask

FAILED_COUNT = 3


class FakeScrapingTaskRepository(ScrapingTaskRepository):
    def __init__(self) -> None:
        self.stale_calls: list[tuple[datetime, str]] = []

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


def test_mark_stale_tasks_failed_uses_two_hour_cutoff() -> None:
    repository = FakeScrapingTaskRepository()
    use_case = CleanupScrapingTasksUseCase(repository)
    now = datetime(2026, 5, 17, 12, 0, tzinfo=UTC)

    failed_count = use_case.mark_stale_tasks_failed(now=now)

    assert failed_count == FAILED_COUNT
    assert repository.stale_calls == [
        (
            now - timedelta(hours=2),
            STALE_TASK_ERROR_MESSAGE,
        ),
    ]
