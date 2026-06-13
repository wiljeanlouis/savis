"""Tests for the Maxi scraper."""

# ruff: noqa: D102, D103, S101

from __future__ import annotations

from typing import TYPE_CHECKING, Self

import pytest
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

from app.adapters.scrapers.maxi.extractor import ITEM_SELECTOR
from app.adapters.scrapers.maxi.scraper import MaxiScraper, MaxiScraperBlockedError
from app.core.ports import ProviderCircuitOpenError

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


class FakeProviderAccessPolicy:
    """Capture provider pacing and circuit-breaker calls."""

    def __init__(self) -> None:
        """Initialize captured policy calls."""
        self.waited: list[str] = []
        self.successes: list[str] = []
        self.blocks: list[str] = []

    def wait_for_request(self, provider_identifier: str) -> None:
        self.waited.append(provider_identifier)

    def record_success(self, provider_identifier: str) -> None:
        self.successes.append(provider_identifier)

    def record_block(self, provider_identifier: str) -> None:
        self.blocks.append(provider_identifier)


class OpenCircuitProviderAccessPolicy(FakeProviderAccessPolicy):
    """Reject provider access before opening the browser."""

    def wait_for_request(self, provider_identifier: str) -> None:
        super().wait_for_request(provider_identifier)
        msg = "Provider access is suspended"
        raise ProviderCircuitOpenError(msg)


class UnexpectedBrowserManager(FakeBrowserManager):
    """Fail if a test unexpectedly opens Chrome."""

    def __enter__(self) -> Self:
        """Reject unexpected browser access."""
        msg = "Browser should not be opened"
        raise AssertionError(msg)


def test_get_offer_by_url_waits_for_item_selector() -> None:
    manager = FakeBrowserManager()
    policy = FakeProviderAccessPolicy()
    scraper = MaxiScraper(  # pyright: ignore[reportArgumentType]
        browser_manager=manager,
        access_policy=policy,
    )

    offer = scraper.get_offer_by_url("https://maxi.ca/fr/product/p/123")

    assert manager.page.waited_for_selector == ITEM_SELECTOR
    assert policy.waited == ["8772"]
    assert policy.successes == ["8772"]
    assert policy.blocks == []
    assert offer is not None
    assert offer.price is not None
    assert offer.price.amount == "6.49"


def test_open_circuit_prevents_browser_navigation() -> None:
    policy = OpenCircuitProviderAccessPolicy()
    scraper = MaxiScraper(  # pyright: ignore[reportArgumentType]
        browser_manager=UnexpectedBrowserManager(),
        access_policy=policy,
    )

    with pytest.raises(ProviderCircuitOpenError, match="suspended"):
        scraper.get_offer_by_url("https://maxi.ca/fr/product/p/123")

    assert policy.waited == ["8772"]
    assert policy.successes == []
    assert policy.blocks == []


def test_get_offer_by_url_reports_when_maxi_blocks_the_scraper() -> None:
    manager = FakeBrowserManager(page=BlockedFakePage())
    policy = FakeProviderAccessPolicy()
    scraper = MaxiScraper(  # pyright: ignore[reportArgumentType]
        browser_manager=manager,
        access_policy=policy,
    )

    with pytest.raises(
        MaxiScraperBlockedError,
        match=r"HTTP 403.*Access Denied",
    ):
        scraper.get_offer_by_url("https://maxi.ca/fr/product/p/123")

    assert manager.page.waited_for_selector is None
    assert policy.successes == []
    assert policy.blocks == ["8772"]


def test_get_offer_by_url_treats_missing_content_as_blocked() -> None:
    manager = FakeBrowserManager(page=ChallengeFakePage())
    policy = FakeProviderAccessPolicy()
    scraper = MaxiScraper(  # pyright: ignore[reportArgumentType]
        browser_manager=manager,
        access_policy=policy,
    )

    with pytest.raises(
        MaxiScraperBlockedError,
        match=r"challenge page.*Just a moment",
    ):
        scraper.get_offer_by_url("https://maxi.ca/fr/product/p/123")

    assert manager.page.waited_for_selector == ITEM_SELECTOR
    assert policy.successes == []
    assert policy.blocks == ["8772"]
