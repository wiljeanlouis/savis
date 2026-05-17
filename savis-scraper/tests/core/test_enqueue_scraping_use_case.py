"""Tests for enqueue scraping use case."""

# ruff: noqa: D103, D107, S101

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from app.core.enqueue_scraping_use_case import EnqueueScrapingUseCase
from app.core.models import ScrapingTask, ScrapingTaskStatus
from app.core.ports import ScrapingTaskRepository, TaskQueue

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID


class FakeTaskQueue(TaskQueue):
    """Task queue fake."""

    def __init__(self, *, fail: bool = False) -> None:
        self.fail = fail
        self.pushed: list[tuple[str, str]] = []

    def push_scraping_offers(self, task_id: str, term: str) -> None:
        """Capture pushed tasks."""
        if self.fail:
            msg = "queue unavailable"
            raise RuntimeError(msg)
        self.pushed.append((task_id, term))


class FakeScrapingTaskRepository(ScrapingTaskRepository):
    """Scraping task repository fake."""

    def __init__(self) -> None:
        self.saved: list[ScrapingTask] = []
        self.completed: list[UUID] = []
        self.failed: list[tuple[UUID, str]] = []

    def save(self, task: ScrapingTask) -> ScrapingTask:
        """Capture saved tasks."""
        self.saved.append(task)
        return task

    def mark_completed(self, task_id: UUID) -> None:
        """Capture completed tasks."""
        self.completed.append(task_id)

    def mark_failed(self, task_id: UUID, error: str) -> None:
        """Capture failed tasks."""
        self.failed.append((task_id, error))

    def mark_stale_in_progress_as_failed(
        self,
        _stale_before: datetime,
        _error: str,
    ) -> int:
        """Capture stale cleanup calls."""
        return 0


def test_scrape_offers_creates_in_progress_task_and_enqueues_it() -> None:
    queue = FakeTaskQueue()
    repository = FakeScrapingTaskRepository()
    use_case = EnqueueScrapingUseCase(queue, repository)

    task = use_case.scrape_offers("flour")

    assert task.status == ScrapingTaskStatus.IN_PROGRESS
    assert task.search_term == "flour"
    assert repository.saved == [task]
    assert queue.pushed == [(str(task.id), "flour")]


def test_scrape_offers_marks_task_failed_when_enqueue_fails() -> None:
    queue = FakeTaskQueue(fail=True)
    repository = FakeScrapingTaskRepository()
    use_case = EnqueueScrapingUseCase(queue, repository)

    with pytest.raises(RuntimeError, match="queue unavailable"):
        use_case.scrape_offers("flour")

    task = repository.saved[0]
    assert repository.failed == [(task.id, "queue unavailable")]
