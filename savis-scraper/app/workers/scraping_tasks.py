"""Celery scraping tasks for aggregating and publishing search results."""

import asyncio

from app.application.use_cases.aggregate_results import AggregateResultsUseCase
from app.config.celery_app import celery
from app.infrastructure.publishers.java_api_publisher import JavaApiPublisher
from app.infrastructure.scraping.browser_manager import BrowserManager
from app.infrastructure.scraping.maxi.scraper import MaxiScraper

browser_manager = BrowserManager()


@celery.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def scrape_multi_site(self, task_id: int, term: str) -> None:
    """Scrape multiple sites for the search term and publish aggregated results."""

    async def run() -> None:

        if browser_manager.browser is None:
            await browser_manager.start()

        scrapers = [
            MaxiScraper(browser_manager),
        ]

        results = await asyncio.gather(
            *[scraper.search(term) for scraper in scrapers],
            return_exceptions=True,
        )

        valid_results = []

        for r in results:
            if not isinstance(r, Exception):
                valid_results.append(r)  # noqa: PERF401

        use_case = AggregateResultsUseCase()
        offers = use_case.execute(valid_results)

        publisher = JavaApiPublisher()

        await publisher.publish({"id": task_id, "offers": offers})

    asyncio.run(run())
