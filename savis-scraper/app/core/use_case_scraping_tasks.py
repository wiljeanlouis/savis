"""Use case for scraping task tracking."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.core.models import ScrapingTask, ScrapingTaskStatus
    from app.core.ports import ScrapingTaskRepository

STALE_TASK_TIMEOUT = timedelta(hours=2)
STALE_TASK_ERROR_MESSAGE = "Task timed out or worker never completed it"


class ScrapingTasksUseCase:
    """Handle scraping task queries and operational cleanup."""

    def __init__(self, scraping_task_repository: ScrapingTaskRepository) -> None:
        """Initialize the use case."""
        self.scraping_task_repository = scraping_task_repository

    def list(self, status: ScrapingTaskStatus | None = None) -> list[ScrapingTask]:
        """List scraping tasks, optionally filtered by status."""
        return self.scraping_task_repository.list(status)

    def mark_stale_tasks_failed(self, now: datetime | None = None) -> int:
        """Mark stale in-progress tasks as failed."""
        current_time = now or datetime.now(UTC)
        stale_before = current_time - STALE_TASK_TIMEOUT
        return self.scraping_task_repository.mark_stale_in_progress_as_failed(
            stale_before=stale_before,
            error=STALE_TASK_ERROR_MESSAGE,
        )
