"""Celery scraping tasks for aggregating and publishing search results."""

import logging

from app.application.use_cases.execute_scraping import ExecuteScrapingUseCase
from app.infrastructure.adapters.publisher.java_api_publisher import JavaApiPublisher
from app.infrastructure.adapters.scraper.scraper_loader import load_scrapers
from app.infrastructure.config.celery_app import celery

java_api_publisher = JavaApiPublisher()


logger = logging.getLogger(__name__)


@celery.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def scrape_offers_task(self, task_id: int, term: str) -> None:
    """Task to run the scraping request."""
    scrapers = load_scrapers()
    use_case = ExecuteScrapingUseCase(scrapers, java_api_publisher)
    use_case.scrape_offers(task_id, term)
