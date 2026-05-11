from typing import TYPE_CHECKING

from .browsermanager.browser_manager import BrowserManager
from .maxi.maxi_scraper import MaxiScraper

if TYPE_CHECKING:
    from app.application.ports.offer_scraper import OfferScraper


def load_scrapers() -> list[OfferScraper]:
    return [
        MaxiScraper(browser_manager=BrowserManager()),
    ]
