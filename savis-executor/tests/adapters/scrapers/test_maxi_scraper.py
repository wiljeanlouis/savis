"""Tests for the Maxi scraper."""

# ruff: noqa: D102, D103, S101

from __future__ import annotations

from typing import TYPE_CHECKING, Self

import pytest
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

from app.adapters.scrapers.maxi.extractor import ITEM_SELECTOR
from app.adapters.scrapers.maxi.scraper import MaxiScraper, MaxiScraperBlockedError

from .html_loader import load_product_details_page_html

if TYPE_CHECKING:
    from types import TracebackType


class FakePage:
    """Minimal Playwright page test double."""

    def __init__(self) -> None:
        """Initialize captured browser calls."""
        self.visited_url: str | None = None
        self.waited_for_selector: str | None = None
        self.url = ""

    def goto(self, url: str, *, wait_until: str) -> None:  # noqa: ARG002
        self.visited_url = url
        self.url = url

    def wait_for_selector(self, selector: str) -> None:
        self.waited_for_selector = selector

    def title(self) -> str:
        return "Product"

    def content(self) -> str:
        return load_product_details_page_html()


class FakeResponse:
    """Minimal Playwright response test double."""

    def __init__(self, status: int) -> None:
        """Initialize the HTTP status."""
        self.status = status


class BlockedFakePage(FakePage):
    """Fake page that simulates an Akamai denial."""

    def goto(self, url: str, *, wait_until: str) -> FakeResponse:
        super().goto(url, wait_until=wait_until)
        return FakeResponse(status=403)

    def title(self) -> str:
        return "Access Denied"


class ChallengeFakePage(FakePage):
    """Fake page that never exposes the expected product content."""

    def wait_for_selector(self, selector: str) -> None:
        super().wait_for_selector(selector)
        msg = "selector timed out"
        raise PlaywrightTimeoutError(msg)

    def title(self) -> str:
        return "Just a moment..."


class FakeBrowserManager:
    """Minimal browser manager test double."""

    def __init__(self, page: FakePage | None = None) -> None:
        """Initialize a stable fake page."""
        self.page = page or FakePage()

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


def test_get_offer_by_url_waits_for_item_selector() -> None:
    manager = FakeBrowserManager()
    scraper = MaxiScraper(browser_manager=manager)  # pyright: ignore[reportArgumentType]

    offer = scraper.get_offer_by_url("https://maxi.ca/fr/product/p/123")

    assert manager.page.waited_for_selector == ITEM_SELECTOR
    assert offer is not None
    assert offer.price is not None
    assert offer.price.amount == "6.49"


def test_get_offer_by_url_reports_when_maxi_blocks_the_scraper() -> None:
    manager = FakeBrowserManager(page=BlockedFakePage())
    scraper = MaxiScraper(browser_manager=manager)  # pyright: ignore[reportArgumentType]

    with pytest.raises(
        MaxiScraperBlockedError,
        match=r"HTTP 403.*Access Denied",
    ):
        scraper.get_offer_by_url("https://maxi.ca/fr/product/p/123")

    assert manager.page.waited_for_selector is None


def test_get_offer_by_url_treats_missing_content_as_blocked() -> None:
    manager = FakeBrowserManager(page=ChallengeFakePage())
    scraper = MaxiScraper(browser_manager=manager)  # pyright: ignore[reportArgumentType]

    with pytest.raises(
        MaxiScraperBlockedError,
        match=r"challenge page.*Just a moment",
    ):
        scraper.get_offer_by_url("https://maxi.ca/fr/product/p/123")

    assert manager.page.waited_for_selector == ITEM_SELECTOR
