import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import Offer
    from .ports import OfferScraper


logger = logging.getLogger(__name__)


def aggregate(results: list[list[Offer]]) -> list[Offer]:

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
        self.scrapers = scrapers

    def scrape_offers(self, term: str) -> list[Offer]:
        logger.info("[ExecuteScrapingUseCase] scrape_offers called with %s", term)

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
