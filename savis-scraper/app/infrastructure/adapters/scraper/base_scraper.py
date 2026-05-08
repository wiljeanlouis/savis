from typing import TYPE_CHECKING

from .browser_manager import BrowserManager
from .maxi.maxi_scraper import MaxiScraper

if TYPE_CHECKING:
    from app.application.ports.offer_scraper import OfferScraper

browser_manager = BrowserManager()


async def load_scrapers() -> list[OfferScraper]:
    if browser_manager.browser is None:
        await browser_manager.start()

    return [
        MaxiScraper(browser_manager),
    ]
