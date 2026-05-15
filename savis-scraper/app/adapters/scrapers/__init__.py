"""Scrapers package."""

from typing import TYPE_CHECKING

from .browser_manager import BrowserManager
from .maxi.scraper import MaxiScraper

if TYPE_CHECKING:
    from app.core.ports import OfferScraper


def load_scrapers() -> list[OfferScraper]:
    return [
        MaxiScraper(browser_manager=BrowserManager()),
    ]
