"""Use case for executor tasks."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING
from uuid import UUID

from app.core.models import SavisTask, SavisTaskStatus, SavisTaskType

if TYPE_CHECKING:
    from app.core.ports import SavisTaskRepository, TaskQueue
    from app.core.use_case_offers import OffersUseCase

STALE_TASK_TIMEOUT = timedelta(hours=2)
STALE_TASK_ERROR_MESSAGE = "Task timed out or worker never completed it"


class SavisTaskUseCase:
    """Manage task enqueueing, execution, listing, and cleanup."""

    def __init__(
        self,
        task_queue: TaskQueue,
        task_repository: SavisTaskRepository,
        offers_use_case: OffersUseCase,
    ) -> None:
        """Initialize the use case."""
        self.task_queue = task_queue
        self.task_repository = task_repository
        self.offers_use_case = offers_use_case

    def enqueue_savis_task(
        self,
        task_type: SavisTaskType,
        payload: dict[str, str],
    ) -> SavisTask:
        """Create and enqueue a task."""
        task = self.task_repository.save(SavisTask.create(task_type, payload))
        try:
            if task_type == SavisTaskType.GET_OFFERS:
                self.task_queue.push_get_offers(
                    str(task.id),
                    payload["search_term"],
                )
            elif task_type == SavisTaskType.REFRESH_OFFER:
                self.task_queue.push_refresh_offer(
                    str(task.id),
                    payload["offer_id"],
                    payload["url"],
                )
        except Exception as exc:
            self.task_repository.mark_failed(task.id, str(exc))
            raise
        return task

    def execute_savis_task(
        self,
        task_id: UUID,
        task_type: SavisTaskType,
        payload: dict[str, str],
    ) -> None:
        """Execute a task according to its type."""
        if task_type == SavisTaskType.GET_OFFERS:
            self.offers_use_case.get_offers(
                search_term=payload["search_term"],
                task_id=task_id,
            )
        elif task_type == SavisTaskType.REFRESH_OFFER:
            self.offers_use_case.refresh_offer_by_url(
                offer_id=UUID(payload["offer_id"]),
                url=payload["url"],
                task_id=task_id,
            )
        self.task_repository.mark_completed(task_id)

    def list(
        self,
        status: SavisTaskStatus | None = None,
        task_type: SavisTaskType | None = None,
    ) -> list[SavisTask]:
        """List tasks, optionally filtered by status and type."""
        return self.task_repository.list(status, task_type)

    def mark_stale_tasks_failed(self, now: datetime | None = None) -> int:
        """Mark stale in-progress tasks as failed."""
        current_time = now or datetime.now(UTC)
        stale_before = current_time - STALE_TASK_TIMEOUT
        return self.task_repository.mark_stale_in_progress_as_failed(
            stale_before=stale_before,
            error=STALE_TASK_ERROR_MESSAGE,
        )
