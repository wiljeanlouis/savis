"""Contains the strategy to scrape offers from maxi.ca.

Returns:
    _type_: a list of Offers for a search term

"""

import logging
from typing import TYPE_CHECKING

from app.application.ports.offer_scraper import OfferScraper

from .maxi_offer import maxi_offer_builder
from .maxi_provider import provider

if TYPE_CHECKING:
    from app.domain.models import Offer
    from app.infrastructure.adapters.scraper.browser_manager import BrowserManager

logger = logging.getLogger(__name__)


class MaxiScraper(OfferScraper):
    def __init__(self, browser_manager: BrowserManager):
        self.browser_manager = browser_manager

    async def search(self, search_term: str) -> list[Offer]:
        """Scrape maxi.ca for a specific search term and returns a list of offers.

        Args:
            search_term (str): the search

        Returns:
            list[Offer]: the list of offers

        """
        offers = []
        page = await self.browser_manager.get_page()
        await page.goto(provider.build_search_url(search_term))
        await page.wait_for_selector('[data-srp-feedback-added="true"]')
        items_selector = (
            '[data-testid="product-grid-component"] > [data-srp-feedback-added="true"]'
        )
        items = page.locator(items_selector)
        count = await items.count()

        for i in range(min(count, 10)):
            item = items.nth(i)
            maxi_offer = await maxi_offer_builder(item)

            logger.info("{%s}", maxi_offer)

            if maxi_offer.badge == "Sponsorisé":
                continue

            offers.append(maxi_offer.extract_offer())

        return offers
