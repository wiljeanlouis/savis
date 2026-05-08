import asyncio
from typing import TYPE_CHECKING

from app.application.services.aggregate_results import aggregate

if TYPE_CHECKING:
    from app.application.ports.offer_publisher import OfferPublisher
    from app.application.ports.offer_scraper import OfferScraper


class ExecuteScrapingUseCase:
    """Call multiple sites scraper for a search term and publish aggregated results."""

    scrapers: list[OfferScraper]
    publisher: OfferPublisher

    def __init__(self, scrapers: list[OfferScraper], publisher: OfferPublisher) -> None:
        self.scrapers = scrapers
        self.publisher = publisher

    async def execute(self, task_id: int, term: str) -> None:

        results = await asyncio.gather(
            *[scraper.search(term) for scraper in self.scrapers],
            return_exceptions=True,
        )

        valid_results = []

        for r in results:
            if not isinstance(r, Exception):
                valid_results.append(r)  # noqa: PERF401

        offers = aggregate(valid_results)

        await self.publisher.publish({"id": task_id, "offers": offers})
