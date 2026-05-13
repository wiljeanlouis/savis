from typing import TYPE_CHECKING

from app.application.services.aggregate_results import aggregate

if TYPE_CHECKING:
    from app.application.ports.offer_scraper import OfferScraper
    from app.domain.models import Offer


class ExecuteScrapingUseCase:
    """Call multiple sites scraper for a search term and publish aggregated results."""

    scrapers: list[OfferScraper]

    def __init__(self, scrapers: list[OfferScraper]) -> None:
        self.scrapers = scrapers

    def scrape_offers(self, term: str) -> list[Offer]:

        results = []

        for scraper in self.scrapers:
            try:
                result = scraper.scrape_offers(term)
                results.append(result)
            except Exception:
                continue

        valid_results = []

        for r in results:
            if not isinstance(r, Exception):
                valid_results.append(r)  # noqa: PERF401

        return aggregate(valid_results)
