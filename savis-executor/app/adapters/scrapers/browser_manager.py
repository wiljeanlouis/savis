"""Browser lifecycle management for provider scrapers."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from urllib.parse import urlparse, urlunparse

import httpx
from playwright.sync_api import (
    Browser,
    BrowserContext,
    Page,
    Playwright,
    Route,
    sync_playwright,
)
from playwright.sync_api import (
    Error as PlaywrightError,
)

from app.config import EnvParams
from app.core.ports import OfferProviderNonRetryableError

if TYPE_CHECKING:
    from types import TracebackType
    from typing import Self

logger = logging.getLogger(__name__)


class BrowserConnectionError(OfferProviderNonRetryableError):
    """Raised when the configured external Chrome cannot be reached."""


class BrowserManager:
    """Manage a Playwright browser for scraping."""

    def __init__(self, cdp_url: str | None = None) -> None:
        """Initialize the external Chrome CDP endpoint."""
        self.cdp_url = cdp_url or EnvParams.BROWSER_CDP_URL
        self.browser: Browser | None = None
        self.context: BrowserContext | None = None
        self.page: Page | None = None
        self.playwright: Playwright | None = None

    def __enter__(self) -> Self:
        """Start the browser context manager."""
        logger.info("[BROWSER] Connecting to external Chrome | cdp=%s", self.cdp_url)
        self.playwright = sync_playwright().start()
        try:
            websocket_url = _resolve_websocket_url(self.cdp_url)
            self.browser = self.playwright.chromium.connect_over_cdp(
                websocket_url,
                headers={"Host": _local_host_header(self.cdp_url)},
            )
        except (httpx.HTTPError, KeyError, PlaywrightError, ValueError) as exc:
            self.playwright.stop()
            self.playwright = None
            msg = (
                f"Cannot connect to external Chrome at {self.cdp_url}. "
                "Start Chrome with remote debugging enabled and verify "
                "the /json/version endpoint."
            )
            raise BrowserConnectionError(msg) from exc
        if not self.browser.contexts:
            self.playwright.stop()
            self.playwright = None
            msg = "External Chrome did not expose a browser context"
            raise RuntimeError(msg)
        self.context = self.browser.contexts[0]
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        """Disconnect from Chrome without stopping the external browser."""
        logger.info("[BROWSER] Disconnecting from external Chrome")
        if self.page is not None:
            self.page.close()
            self.page = None
        self.context = None
        self.browser = None
        if self.playwright is not None:
            self.playwright.stop()
            self.playwright = None

    def get_page(self) -> Page:
        """Create a browser page optimized for scraping."""
        if self.context is None:
            msg = "BrowserManager must be entered before creating a page"
            raise RuntimeError(msg)
        self.page = self.context.new_page()

        def block_resources(route: Route) -> None:
            if route.request.resource_type in ["media", "font"]:
                route.abort()
            else:
                route.continue_()

        self.page.route("**/**", block_resources)

        return self.page


def _resolve_websocket_url(cdp_url: str) -> str:
    parsed_url = urlparse(cdp_url)
    if parsed_url.scheme in {"ws", "wss"}:
        return cdp_url
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.hostname:
        msg = f"Unsupported Chrome CDP URL: {cdp_url}"
        raise ValueError(msg)

    version_url = f"{cdp_url.rstrip('/')}/json/version"
    response = httpx.get(
        version_url,
        headers={"Host": _local_host_header(cdp_url)},
        timeout=5,
    )
    response.raise_for_status()

    websocket_url = urlparse(response.json()["webSocketDebuggerUrl"])
    websocket_host = parsed_url.hostname
    if parsed_url.port is not None:
        websocket_host = f"{websocket_host}:{parsed_url.port}"
    return urlunparse(websocket_url._replace(netloc=websocket_host))


def _local_host_header(cdp_url: str) -> str:
    parsed_url = urlparse(cdp_url)
    if parsed_url.port is None:
        return "localhost"
    return f"localhost:{parsed_url.port}"
