"""Use case for executor tasks."""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from math import ceil
from typing import TYPE_CHECKING
from uuid import UUID

from app.core.models import (
    OfferType,
    ProviderName,
    SavisTask,
    SavisTaskSortField,
    SavisTaskStatus,
    SavisTaskType,
    SortDirection,
)

if TYPE_CHECKING:
    from collections.abc import Callable

    from app.core.ports import SavisTaskRepository, TaskQueue
    from app.core.use_case_offers import OffersUseCase

STALE_TASK_TIMEOUT = timedelta(hours=2)
STALE_TASK_ERROR_MESSAGE = "Task timed out or worker never completed it"
logger = logging.getLogger(__name__)


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
    ) -> SavisTask | None:
        """Create and enqueue a task."""
        handlers: dict[
            SavisTaskType,
            Callable[[dict[str, str]], SavisTask | None],
        ] = {
            SavisTaskType.GET_OFFER: self._enqueue_get_offer_task,
            SavisTaskType.GET_OFFERS: self._enqueue_get_offers_task,
            SavisTaskType.REFRESH_OFFER: self._enqueue_refresh_offer_task,
        }
        return handlers[task_type](payload)

    def _enqueue_get_offer_task(self, payload: dict[str, str]) -> SavisTask | None:
        return self._save_and_push(
            SavisTaskType.GET_OFFER,
            payload,
            lambda task_id: self.task_queue.push_get_offer(
                task_id=task_id,
                url=payload["url"],
                search_term=payload["search_term"],
                provider=ProviderName(
                    payload.get("provider", ProviderName.MAXI.value),
                ),
                offer_type=OfferType(payload.get("offer_type", OfferType.FOOD.value)),
            ),
        )

    def _enqueue_get_offers_task(self, payload: dict[str, str]) -> SavisTask | None:
        return self._save_and_push(
            SavisTaskType.GET_OFFERS,
            payload,
            lambda task_id: self.task_queue.push_get_offers(
                task_id=task_id,
                search_term=payload["search_term"],
                offer_type=OfferType(payload.get("offer_type", OfferType.FOOD.value)),
            ),
        )

    def _enqueue_refresh_offer_task(self, payload: dict[str, str]) -> SavisTask:
        return self._save_and_push(
            SavisTaskType.REFRESH_OFFER,
            payload,
            lambda task_id: self.task_queue.push_refresh_offer(
                task_id=task_id,
                offer_id=payload["offer_id"],
                url=payload["url"],
            ),
        )

    def _save_and_push(
        self,
        task_type: SavisTaskType,
        payload: dict[str, str],
        push: Callable[[str], None],
    ) -> SavisTask:
        task = self.task_repository.save(
            SavisTask.create(task_type=task_type, payload=payload),
        )
        try:
            push(str(task.id))
        except Exception as exc:
            self.task_repository.mark_failed(task.id, str(exc))
            raise
        return task

    def enqueue_due_offer_refresh_tasks(
        self,
        now: datetime | None = None,
    ) -> list[SavisTask]:
        """Create refresh tasks for valid offers whose refresh time is due."""
        due_offers = self.offers_use_case.find_due_valid_offers(now=now)
        logger.info("[TASKS] Found %s offers due for refresh", len(due_offers))

        tasks = []
        for offer in due_offers:
            if offer.id is None:
                logger.warning(
                    "[TASKS] Skipping due offer without id | external_id=%s",
                    offer.external_id,
                )
                continue

            tasks.append(
                self.enqueue_savis_task(
                    SavisTaskType.REFRESH_OFFER,
                    {"offer_id": str(offer.id), "url": offer.url},
                ),
            )
        return tasks

    def execute_savis_task(
        self,
        task_id: UUID,
        task_type: SavisTaskType,
        payload: dict[str, str],
    ) -> None:
        """Execute a task according to its type."""
        handlers: dict[
            SavisTaskType,
            Callable[[UUID, dict[str, str]], None],
        ] = {
            SavisTaskType.GET_OFFER: self._execute_get_offer_task,
            SavisTaskType.GET_OFFERS: self._execute_get_offers_task,
            SavisTaskType.REFRESH_OFFER: self._execute_refresh_offer_task,
        }

        handlers[task_type](task_id, payload)
        self.task_repository.mark_completed(task_id)

    def _execute_get_offer_task(self, task_id: UUID, payload: dict[str, str]) -> None:
        self.offers_use_case.get_offer(
            url=payload["url"],
            search_term=payload["search_term"],
            task_id=task_id,
            provider_name=ProviderName(
                payload.get("provider", ProviderName.MAXI.value),
            ),
            offer_type=OfferType(payload.get("offer_type", OfferType.FOOD.value)),
        )

    def _execute_get_offers_task(self, task_id: UUID, payload: dict[str, str]) -> None:
        self.offers_use_case.get_offers(
            search_term=payload["search_term"],
            task_id=task_id,
            offer_type=OfferType(payload.get("offer_type", OfferType.FOOD.value)),
        )

    def _execute_refresh_offer_task(
        self,
        task_id: UUID,
        payload: dict[str, str],
    ) -> None:
        self.offers_use_case.refresh_offer_by_url(
            offer_id=UUID(payload["offer_id"]),
            url=payload["url"],
            task_id=task_id,
        )

    def list(  # noqa: PLR0913
        self,
        status: SavisTaskStatus | None = None,
        task_type: SavisTaskType | None = None,
        page: int = 1,
        size: int = 20,
        sort_by: SavisTaskSortField = SavisTaskSortField.CREATED_AT,
        sort_direction: SortDirection = SortDirection.DESC,
    ) -> tuple[list[SavisTask], int, int]:
        """List paginated tasks, optionally filtered by status and type."""
        tasks, total_items = self.task_repository.list(
            status=status,
            task_type=task_type,
            page=page,
            size=size,
            sort_by=sort_by,
            sort_direction=sort_direction,
        )
        total_pages = ceil(total_items / size) if total_items else 0
        return tasks, total_items, total_pages

    def mark_stale_tasks_failed(self, now: datetime | None = None) -> int:
        """Mark stale in-progress tasks as failed."""
        current_time = now or datetime.now(UTC)
        stale_before = current_time - STALE_TASK_TIMEOUT
        return self.task_repository.mark_stale_in_progress_as_failed(
            stale_before=stale_before,
            error=STALE_TASK_ERROR_MESSAGE,
        )
