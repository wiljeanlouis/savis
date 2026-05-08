"""Contains the strategy to scrape offers from maxi.ca.

Returns:
    _type_: a list of Offers for a search term

"""

import logging
from typing import TYPE_CHECKING

from app.domain.ports.scraper import Scraper
from app.infrastructure.scraping.base_scraper import get_attr, get_text
from app.infrastructure.scraping.maxi.config import PROVIDER_IDENTIFIER
from app.infrastructure.scraping.maxi.scraped_offer import ScrapedOffer

if TYPE_CHECKING:
    from playwright.async_api import Locator

    from app.domain.models.offer import Offer
    from app.infrastructure.scraping.browser_manager import BrowserManager

logger = logging.getLogger(__name__)


class MaxiScraper(Scraper):
    def __init__(self, browser_manager: BrowserManager):
        self.browser_manager = browser_manager

    def build_search_url(self, search_term: str) -> str:
        """Build the maxi.ca search url for the search term.

        Args:
            search_term (str): The search term for the site

        Returns:
            str: The complete url for with the search term and the store

        """
        return f"https://www.maxi.ca/fr/search?search-bar={search_term}&storeId={PROVIDER_IDENTIFIER}"

    async def scraped_offer_builder(self, item: Locator) -> ScrapedOffer:
        """Extract all the offer field from a specific page Locator.

        Args:
            item (Locator): The locator

        Returns:
            Offer: The scraped offer built from the page locator

        """
        return ScrapedOffer(
            badge=await get_text(item.locator('[data-testid="product-badge"]')),
            external_id=await get_attr(
                item.locator('[data-testid="product-title"]'),
                "id",
            ),
            url=await get_attr(item.locator("a"), "href"),
            brand=await get_text(item.locator('[data-testid="product-brand"]')),
            label=await get_text(item.locator('[data-testid="product-title"]')),
            _price=await get_text(item.locator('[data-testid="regular-price"]')),
            _package_size=await get_text(
                item.locator('[data-testid="product-package-size"]'),
            ),
            image_url=await get_attr(item.locator("img").first, "src"),
        )

    async def search(self, search_term: str) -> list[Offer]:
        """Scrape maxi.ca for a specific search term and returns a list of offers.

        Args:
            search_term (str): the search

        Returns:
            list[Offer]: the list of offers

        """
        offers = []
        page = await self.browser_manager.get_page()
        await page.goto(self.build_search_url(search_term))
        await page.wait_for_selector('[data-srp-feedback-added="true"]')
        items_selector = (
            '[data-testid="product-grid-component"] > [data-srp-feedback-added="true"]'
        )
        items = page.locator(items_selector)
        count = await items.count()

        for i in range(min(count, 10)):
            item = items.nth(i)
            scraped_offer = await self.scraped_offer_builder(item)

            logger.info(f"=== {scraped_offer.badge}")
            logger.info(f"=== {scraped_offer.brand}")
            logger.info(f"=== {scraped_offer.external_id}")
            logger.info(f"=== {scraped_offer.url}")
            logger.info(f"=== {scraped_offer.label}")
            logger.info(f"=== {scraped_offer.price}")
            logger.info(f"=== {scraped_offer.package_size}")
            logger.info(f"=== {scraped_offer.image_url}")
            logger.info("=======================")

            if scraped_offer.badge == "Sponsorisé":
                continue
            offers.append(scraped_offer.extract_offer())

        return offers
