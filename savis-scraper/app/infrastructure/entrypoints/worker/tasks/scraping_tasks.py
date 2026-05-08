"""Celery scraping tasks for aggregating and publishing search results."""

import asyncio

from app.application.use_cases.execute_scraping import ExecuteScrapingUseCase
from app.infrastructure.adapters.publisher.java_api_publisher import JavaApiPublisher
from app.infrastructure.adapters.scraper.base_scraper import load_scrapers
from app.infrastructure.config.celery_app import celery

java_api_publisher = JavaApiPublisher()


@celery.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def scrape_task(self, task_id: int, term: str) -> None:
    """Task to run the scraping request."""

    async def run() -> None:

        scrapers = await load_scrapers()
        use_case = ExecuteScrapingUseCase(scrapers, java_api_publisher)

        await use_case.execute(task_id, term)

    asyncio.run(run())
