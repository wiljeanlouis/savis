"""Celery scraping tasks."""

import logging
from uuid import UUID

from celery import Task

from app.adapters.celery.celery_app import celery_app
from app.adapters.celery.celery_wiring import (
    get_savis_task_use_case,
)
from app.core.models import OfferType, SavisTaskType

logger = logging.getLogger(__name__)


class ReportingTask(Task):
    """Celery task base that tracks task failures."""

    def on_failure(
        self,
        exc: BaseException,
        task_id: str,
        args: tuple[object, ...],
        kwargs: dict[str, object],
        einfo: object,  # noqa: ARG002
    ) -> None:
        """Track task failure."""
        logger.info(
            "[CELERY TASK] task failed | task_id=%s args=%s kwargs=%s",
            task_id,
            args,
            kwargs,
        )

        if not args or not isinstance(args[0], str):
            logger.error("Cannot report task failure without task id")
            return

        get_savis_task_use_case().task_repository.mark_failed(UUID(args[0]), str(exc))


@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    base=ReportingTask,
)
def get_offers_task(
    _self: Task,
    task_id: str,
    search_term: str,
    offer_type: str = OfferType.FOOD.value,
) -> None:
    """Run a get-offers request."""
    logger.info("[CELERY TASK] get_offers_task begin with %s", task_id)
    get_savis_task_use_case().execute_savis_task(
        UUID(task_id),
        SavisTaskType.GET_OFFERS,
        {"search_term": search_term, "offer_type": offer_type},
    )


@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    base=ReportingTask,
)
def refresh_offer_task(
    _self: Task,
    task_id: str,
    offer_id: str,
    url: str,
) -> None:
    """Run a refresh-offer request."""
    get_savis_task_use_case().execute_savis_task(
        UUID(task_id),
        SavisTaskType.REFRESH_OFFER,
        {"offer_id": offer_id, "url": url},
    )


@celery_app.task
def schedule_due_offer_refresh_tasks() -> int:
    """Create refresh tasks for valid offers due for refresh."""
    tasks = get_savis_task_use_case().enqueue_due_offer_refresh_tasks()
    logger.info("[CELERY TASK] scheduled %s due offer refresh tasks", len(tasks))
    return len(tasks)


@celery_app.task
def cleanup_stale_savis_tasks() -> int:
    """Mark stale in-progress tasks as failed."""
    failed_count = get_savis_task_use_case().mark_stale_tasks_failed()
    logger.info("[CELERY TASK] marked %s stale tasks as failed", failed_count)
    return failed_count
