"""Scrapers package."""

from typing import TYPE_CHECKING

from .browser_manager import BrowserManager
from .maxi.scraper import MaxiScraper

if TYPE_CHECKING:
    from app.core.ports import OfferProvider


def load_offer_providers() -> list[OfferProvider]:
    """Load all configured offer providers."""
    return [
        MaxiScraper(browser_manager=BrowserManager()),
    ]
