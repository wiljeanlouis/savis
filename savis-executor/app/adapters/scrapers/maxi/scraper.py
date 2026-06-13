"""Contains the strategy to scrape offers from maxi.ca."""

import logging
from typing import TYPE_CHECKING

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

from app.core.ports import OfferProvider, OfferProviderBlockedError

from .details_extractor import (
    ITEM_SELECTOR,
    extract_offer_from_product_details_html,
)
from .list_extractor import (
    ITEM_LIST_SELECTOR,
    extract_offer_from_product_list_html,
)
from .provider import provider

if TYPE_CHECKING:
    from app.adapters.scrapers.browser_manager import BrowserManager
    from app.core.models import Offer
    from app.core.ports import ProviderAccessPolicy

logger = logging.getLogger(__name__)


class MaxiScraperBlockedError(OfferProviderBlockedError):
    """Raised when Maxi refuses the scraper request."""


class MaxiScraper(OfferProvider):
    """Scrape the maxi website for collecting offers for a specific search term."""

    identifier = provider.identifier

    def __init__(
        self,
        browser_manager: BrowserManager,
        access_policy: ProviderAccessPolicy,
    ) -> None:
        """Init function."""
        self.browser_manager = browser_manager
        self.access_policy = access_policy

    def load_page(self, url: str, wait_for_selector: str) -> str:
        """Load the page from the given url.

        Args:
            url (str): the url
            wait_for_selector (str): the wait_for_selector

        Returns:
            str: the html content

        """
        self.access_policy.wait_for_request(provider.identifier)
        with self.browser_manager as manager:
            page = manager.get_page()
            response = page.goto(url, wait_until="domcontentloaded")
            if response is not None and response.status in {403, 429}:
                msg = (
                    f"Maxi blocked the scraper with HTTP {response.status} "
                    f"at {page.url} ({page.title()})"
                )
                logger.error("[MAXI] %s", msg)
                self._record_block()
                raise MaxiScraperBlockedError(msg)
            try:
                page.wait_for_selector(wait_for_selector)
            except PlaywrightTimeoutError as exc:
                msg = (
                    "Maxi did not expose the expected content, likely due to "
                    f"a challenge page at {page.url} ({page.title()})"
                )
                logger.exception("[MAXI] %s", msg)
                self._record_block()
                raise MaxiScraperBlockedError(msg) from exc
            html = page.content()
            self._record_success()
            return html

    def _record_success(self) -> None:
        try:
            self.access_policy.record_success(provider.identifier)
        except Exception:
            logger.exception("[MAXI] Failed to persist provider access success")

    def _record_block(self) -> None:
        try:
            self.access_policy.record_block(provider.identifier)
        except Exception:
            logger.exception("[MAXI] Failed to persist provider access block")

    def get_offer_by_url(self, url: str) -> Offer | None:
        """Scrape maxi.ca for a specific product url and returns the offer.

        Args:
            url (str): url of the product

        Returns:
            Offer: the offer

        """
        logger.info("[MAXI] Scraping url = %s", url)
        html = self.load_page(url, ITEM_SELECTOR)

        return extract_offer_from_product_details_html(url, html)

    def get_offers(self, search_term: str) -> list[Offer]:
        """Scrape maxi.ca for a specific search term and returns a list of offers.

        Args:
            search_term (str): the search

        Returns:
            list[Offer]: the list of offers

        """
        logger.info("[MAXI] Scraping term = %s", search_term)

        url = provider.build_search_url(search_term)
        html = self.load_page(url, ITEM_LIST_SELECTOR)

        return extract_offer_from_product_list_html(search_term, html)
