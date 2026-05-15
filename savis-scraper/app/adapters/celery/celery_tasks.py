"""Celery scraping tasks for aggregating and publishing search results."""

import logging

from app.adapters.java_api_publisher import JavaApiPublisher
from app.adapters.scrapers import load_scrapers
from app.core.execute_scraping_use_case import ExecuteScrapingUseCase
from celery import Task

from .celery_app import celery_app

java_api_publisher = JavaApiPublisher()


logger = logging.getLogger(__name__)


class ReportingTask(Task):
    def on_failure(
        self,
        exc: Exception,
        task_id: str,
        args: tuple,
        kwargs: dict,
        einfo: dict,
    ) -> None:

        logger.info(
            "[ReportingTask] exc={%s}, task_id={%s}, args={%s}, kwargs={%s}, einfo={%s}",
            exc,
            task_id,
            args,
            kwargs,
            einfo,
        )

        scraping_task_id = args[0]

        java_api_publisher.publish_failure(
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
def scrape_offers_task(self, scraping_task_id: str, term: str) -> None:
    """Task to run the scraping request."""
    logger.info("[CELERY TASK] scrape_offers_task begin with %s", scraping_task_id)
    scrapers = load_scrapers()
    use_case = ExecuteScrapingUseCase(scrapers)
    offers = use_case.scrape_offers(term=term)

    java_api_publisher.publish_success({"id": scraping_task_id, "offers": offers})
