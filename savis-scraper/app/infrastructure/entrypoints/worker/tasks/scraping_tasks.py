"""Celery scraping tasks for aggregating and publishing search results."""

import logging

from celery import Task

from app.application.use_cases.execute_scraping import ExecuteScrapingUseCase
from app.infrastructure.adapters.publisher.java_api_publisher import JavaApiPublisher
from app.infrastructure.adapters.scraper import scraper_loader
from app.infrastructure.config.celery_app import celery

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


@celery.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    base=ReportingTask,
)
def scrape_offers_task(self, scraping_task_id: str, term: str) -> None:
    """Task to run the scraping request."""
    test = 0 / 0
    scrapers = scraper_loader.load_scrapers()
    use_case = ExecuteScrapingUseCase(scrapers)
    offers = use_case.scrape_offers(term=term)

    java_api_publisher.publish_success({"id": scraping_task_id, "offers": offers})
