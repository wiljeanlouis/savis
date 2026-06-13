"""Scrapers package."""

from typing import TYPE_CHECKING

from .browser_manager import BrowserManager
from .maxi.provider import provider
from .maxi.scraper import MaxiScraper

if TYPE_CHECKING:
    from app.core.ports import OfferProvider, ProviderAccessPolicy


def load_offer_providers(
    access_policy: ProviderAccessPolicy,
) -> dict[str, OfferProvider]:
    """Load all configured offer providers."""
    return {
        provider.name: MaxiScraper(
            browser_manager=BrowserManager(),
            access_policy=access_policy,
        ),
    }
