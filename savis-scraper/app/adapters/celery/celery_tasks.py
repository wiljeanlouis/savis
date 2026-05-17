"""Celery scraping tasks."""

import logging
from uuid import UUID

from celery import Task

from app.adapters.celery.celery_app import celery_app
from app.adapters.celery.celery_wiring import (
    get_execute_scraping_use_case,
    get_result_publisher,
    get_scraping_task_repository,
)

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
            "[CELERY TASK] scrape_offers_task failed | task_id=%s args=%s kwargs=%s",
            task_id,
            args,
            kwargs,
        )

        if not args or not isinstance(args[0], str):
            logger.error("Cannot report scraping task failure without task id")
            return

        scraping_task_id = args[0]
        scraping_task_uuid = UUID(scraping_task_id)
        repository = get_scraping_task_repository()

        repository.mark_failed(scraping_task_uuid, str(exc))


@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    base=ReportingTask,
)
def scrape_offers_task(_self: Task, scraping_task_id: str, term: str) -> None:
    """Run a scraping request."""
    logger.info("[CELERY TASK] scrape_offers_task begin with %s", scraping_task_id)

    use_case = get_execute_scraping_use_case()
    publisher = get_result_publisher()
    repository = get_scraping_task_repository()

    offers = use_case.scrape_offers(term=term)

    publisher.publish_success(
        {
            "id": scraping_task_id,
            "offers": offers,
        },
    )
    repository.mark_completed(UUID(scraping_task_id))
