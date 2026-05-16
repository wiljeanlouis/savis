"""Celery scraping tasks."""

import logging

from celery import Task

from app.adapters.celery.celery_app import celery_app
from app.adapters.celery.celery_wiring import (
    get_execute_scraping_use_case,
    get_java_api_publisher,
)

logger = logging.getLogger(__name__)


class ReportingTask(Task):
    """Celery task base that reports task failures."""

    def on_failure(
        self,
        exc: Exception,
        task_id: str,
        args: tuple,
        kwargs: dict,
        einfo: object,
    ) -> None:
        """Publish task failure."""
        scraping_task_id = args[0]
        publisher = get_java_api_publisher()

        publisher.publish_failure(
            scraping_task_id=scraping_task_id,
            error=str(exc),
        )


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
    publisher = get_java_api_publisher()

    offers = use_case.scrape_offers(term=term)

    publisher.publish_success(
        {
            "id": scraping_task_id,
            "offers": offers,
        },
    )
