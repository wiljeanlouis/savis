"""Contains the strategy to scrape offers from maxi.ca."""

import logging
from typing import TYPE_CHECKING

from app.core.ports import OfferProvider

from .extractor import (
    PRICE_SELECTOR,
    extract_offer_from_product_details_html,
    extract_offer_from_product_list_html,
)
from .provider import provider

if TYPE_CHECKING:
    from app.adapters.scrapers.browser_manager import BrowserManager
    from app.core.models import Offer

logger = logging.getLogger(__name__)


class MaxiScraper(OfferProvider):
    """Scrape the maxi website for collecting offers for a specific search term."""

    def __init__(self, browser_manager: BrowserManager) -> None:
        """Init function."""
        self.browser_manager = browser_manager

    def load_page(self, url: str, wait_for_selector: str) -> str:
        """Load the page from the given url.

        Args:
            url (str): the url
            wait_for_selector (str): the wait_for_selector

        Returns:
            str: the html content

        """
        with self.browser_manager as manager:
            page = manager.get_page()
            page.goto(url)
            page.wait_for_selector(wait_for_selector)
            return page.content()

    def get_offers(self, search_term: str) -> list[Offer]:
        """Scrape maxi.ca for a specific search term and returns a list of offers.

        Args:
            search_term (str): the search

        Returns:
            list[Offer]: the list of offers

        """
        logger.info("[MAXI] Scraping term = %s", search_term)

        url = provider.build_search_url(search_term)
        html = self.load_page(url, '[data-srp-feedback-added="true"]')

        return extract_offer_from_product_list_html(search_term, html)

    def refresh_offer_price_by_url(self, url: str) -> Offer | None:
        """Scrape maxi.ca for a specific product url and returns the offer.

        Args:
            url (str): url of the product

        Returns:
            Offer: the offer

        """
        logger.info("[MAXI] Scraping url = %s", url)
        html = self.load_page(url, PRICE_SELECTOR)

        return extract_offer_from_product_details_html(url, html)
