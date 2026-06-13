"""Tests for the scraper browser lifecycle."""

# ruff: noqa: D101, D102, D103, D107, S101

from typing import TYPE_CHECKING

import httpx
import pytest

from app.adapters.scrapers import browser_manager
from app.adapters.scrapers.browser_manager import BrowserConnectionError, BrowserManager

if TYPE_CHECKING:
    from collections.abc import Callable


class FakePage:
    def __init__(self) -> None:
        self.routes: list[tuple[str, Callable[..., None]]] = []
        self.closed = False

    def route(self, pattern: str, handler: Callable[..., None]) -> None:
        self.routes.append((pattern, handler))

    def close(self) -> None:
        self.closed = True


class FakeBrowserContext:
    def __init__(self) -> None:
        self.page = FakePage()

    def new_page(self) -> FakePage:
        return self.page


class FakeBrowser:
    def __init__(self) -> None:
        self.contexts = [FakeBrowserContext()]


class FakeChromium:
    def __init__(self) -> None:
        self.browser = FakeBrowser()
        self.cdp_url = ""
        self.headers: dict[str, str] = {}

    def connect_over_cdp(
        self,
        cdp_url: str,
        *,
        headers: dict[str, str],
    ) -> FakeBrowser:
        self.cdp_url = cdp_url
        self.headers = headers
        return self.browser


class FakeHttpResponse:
    def raise_for_status(self) -> None:
        pass

    def json(self) -> dict[str, str]:
        return {
            "webSocketDebuggerUrl": (
                "ws://localhost:9222/devtools/browser/browser-id"
            ),
        }


def fake_http_get(*_args: object, **_kwargs: object) -> FakeHttpResponse:
    return FakeHttpResponse()


def unavailable_http_get(*_args: object, **_kwargs: object) -> FakeHttpResponse:
    msg = "connection refused"
    raise httpx.ConnectError(msg)


class FakePlaywright:
    def __init__(self, chromium: FakeChromium | None = None) -> None:
        self.chromium = chromium or FakeChromium()
        self.stopped = False

    def stop(self) -> None:
        self.stopped = True


class FakePlaywrightManager:
    def __init__(self, playwright: FakePlaywright) -> None:
        self.playwright = playwright

    def start(self) -> FakePlaywright:
        return self.playwright


def test_browser_manager_connects_to_external_chrome(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_playwright = FakePlaywright()
    monkeypatch.setattr(
        browser_manager,
        "sync_playwright",
        lambda: FakePlaywrightManager(fake_playwright),
    )
    monkeypatch.setattr(
        browser_manager.httpx,
        "get",
        fake_http_get,
    )

    with BrowserManager(cdp_url="http://chrome-host:9222") as manager:
        page = manager.get_page()

    assert fake_playwright.chromium.cdp_url == (
        "ws://chrome-host:9222/devtools/browser/browser-id"
    )
    assert fake_playwright.chromium.headers == {"Host": "localhost:9222"}
    assert page.routes[0][0] == "**/**"
    assert page.closed is True
    assert fake_playwright.stopped is True


def test_browser_manager_requires_active_context() -> None:
    manager = BrowserManager()

    with pytest.raises(RuntimeError, match="must be entered"):
        manager.get_page()


def test_browser_manager_reports_unavailable_external_chrome(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_playwright = FakePlaywright()
    monkeypatch.setattr(
        browser_manager,
        "sync_playwright",
        lambda: FakePlaywrightManager(fake_playwright),
    )
    monkeypatch.setattr(
        browser_manager.httpx,
        "get",
        unavailable_http_get,
    )

    with pytest.raises(
        BrowserConnectionError,
        match=r"Cannot connect.*http://chrome-host:9222.*json/version",
    ), BrowserManager(cdp_url="http://chrome-host:9222"):
        pass

    assert fake_playwright.stopped is True
