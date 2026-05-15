"""Contains the strategy to scrape offers from maxi.ca."""

import logging
from typing import TYPE_CHECKING

from app.core.ports import OfferScraper

from .extractor import extract_offers
from .provider import provider

if TYPE_CHECKING:
    from app.adapters.scrapers.browser_manager import BrowserManager
    from app.core.models import Offer

logger = logging.getLogger(__name__)


class MaxiScraper(OfferScraper):
    """Scrape the maxi website for collecting offers for a specific search term."""

    def __init__(self, browser_manager: BrowserManager) -> None:
        """Init function."""
        self.browser_manager = browser_manager

    def load_page(self, url: str) -> str:
        """Load the page from the given url.

        Args:
            url (str): the url

        Returns:
            str: the html content

        """
        with self.browser_manager as manager:
            page = manager.get_page()
            page.goto(url)
            page.wait_for_selector('[data-srp-feedback-added="true"]')
            return page.content()

    def scrape_offers(self, search_term: str) -> list[Offer]:
        """Scrape maxi.ca for a specific search term and returns a list of offers.

        Args:
            search_term (str): the search

        Returns:
            list[Offer]: the list of offers

        """
        logger.info("[MAXI] Scraping term = %s", search_term)

        url = provider.build_search_url(search_term)
        html = self.load_page(url)

        return extract_offers(search_term, html)
