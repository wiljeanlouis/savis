"""Use case for executing provider scraping."""

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import Offer
    from .ports import OfferScraper


logger = logging.getLogger(__name__)


class ScrapingFailedError(RuntimeError):
    """Raised when no provider scraper can return a successful result."""


def aggregate(results: list[list[Offer]]) -> list[Offer]:
    """Aggregate offers from multiple scraper results."""
    logger.info("[AGGREGATOR] Start aggregation with {%s} sources", len(results))

    offers = []

    for source_result in results:
        for offer in source_result:
            normalized = _normalize(offer)

            if normalized:
                offers.append(normalized)

    logger.info("[AGGREGATOR] Aggregated {%s} offers", len(results))

    return offers


def _normalize(offer: Offer) -> Offer:

    return offer


class ExecuteScrapingUseCase:
    """Call multiple sites scraper for a search term and publish aggregated results."""

    scrapers: list[OfferScraper]

    def __init__(self, scrapers: list[OfferScraper]) -> None:
        """Initialize the use case."""
        self.scrapers = scrapers

    def scrape_offers(self, term: str) -> list[Offer]:
        """Scrape and aggregate offers for a search term."""
        logger.info("[ExecuteScrapingUseCase] scrape_offers called with %s", term)

        results = []
        errors: list[Exception] = []

        for scraper in self.scrapers:
            try:
                result = scraper.scrape_offers(term)
                results.append(result)
            except Exception as exc:
                logger.exception("Provider scraper failed for term %s", term)
                errors.append(exc)

        if not results and errors:
            msg = f"All provider scrapers failed for term {term!r}"
            raise ScrapingFailedError(msg) from errors[-1]

        return aggregate(results)
