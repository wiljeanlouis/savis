"""Tests for the Maxi scraper."""

# ruff: noqa: D102, D103, S101

from __future__ import annotations

from typing import TYPE_CHECKING, Self

from app.adapters.scrapers.maxi.extractor import PRICE_SELECTOR
from app.adapters.scrapers.maxi.scraper import MaxiScraper

if TYPE_CHECKING:
    from types import TracebackType


class FakePage:
    """Minimal Playwright page test double."""

    def __init__(self) -> None:
        """Initialize captured browser calls."""
        self.visited_url: str | None = None
        self.waited_for_selector: str | None = None

    def goto(self, url: str) -> None:
        self.visited_url = url

    def wait_for_selector(self, selector: str) -> None:
        self.waited_for_selector = selector

    def content(self) -> str:
        return """
        <div class="product-details-page-details__visibility-sensor">
          <span class="product-name__item product-name__item--brand">Natrel</span>
          <h1 class="product-name__item product-name__item--name">Milk</h1>
          <span class="product-name__item product-name__item--package-size">2 l</span>
          <div class="selling-price-list__item">
            <span class="price__value selling-price-list__item__price
              selling-price-list__item__price--sale__value">
              4,99 $
            </span>
          </div>
        </div>
        """


class FakeBrowserManager:
    """Minimal browser manager test double."""

    def __init__(self) -> None:
        """Initialize a stable fake page."""
        self.page = FakePage()

    def __enter__(self) -> Self:
        """Enter the fake browser context."""
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        """Exit the fake browser context."""

    def get_page(self) -> FakePage:
        return self.page


def test_refresh_offer_price_by_url_waits_for_price_selector() -> None:
    manager = FakeBrowserManager()
    scraper = MaxiScraper(browser_manager=manager)

    offer = scraper.refresh_offer_price_by_url("https://maxi.ca/fr/product/p/123")

    assert manager.page.waited_for_selector == PRICE_SELECTOR
    assert offer is not None
    assert offer.price is not None
    assert offer.price.amount == "4.99"
