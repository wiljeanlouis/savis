"""Browser lifecycle management for provider scrapers."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from playwright.sync_api import Browser, Page, Playwright, Route, sync_playwright

if TYPE_CHECKING:
    from types import TracebackType
    from typing import Self

logger = logging.getLogger(__name__)


class BrowserManager:
    """Manage a Playwright browser for scraping."""

    browser: Browser
    playwright: Playwright

    def __enter__(self) -> Self:
        """Start the browser context manager."""
        logger.info("[BROWSER] Starting browser")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=True,
            args=[
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-gpu",
            ],
        )
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        """Stop the browser context manager."""
        logger.info("[BROWSER] Stopping browser")
        if self.browser:
            for context in self.browser.contexts:
                context.close()
            self.browser.close()
        if self.playwright:
            self.playwright.stop()

    def get_page(self) -> Page:
        """Create a browser page optimized for scraping."""
        context = self.browser.new_context()
        page = context.new_page()

        def block_resources(route: Route) -> None:
            if route.request.resource_type in ["media", "font"]:
                route.abort()
            else:
                route.continue_()

        page.route("**/**", block_resources)

        return page
