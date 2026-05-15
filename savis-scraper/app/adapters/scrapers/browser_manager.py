import logging

from playwright.sync_api import Browser, Page, Playwright, Route, sync_playwright

logger = logging.getLogger(__name__)


class BrowserManager:
    browser: Browser
    playwright: Playwright

    def __enter__(self):
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

    def __exit__(self, exc_type, exc, tb):
        logger.info("[BROWSER] Stopping browser")
        if self.browser:
            for context in self.browser.contexts:
                context.close()
            self.browser.close()
        if self.playwright:
            self.playwright.stop()

    def get_page(self) -> Page:
        context = self.browser.new_context()
        page = context.new_page()

        def block_resources(route: Route) -> None:
            if route.request.resource_type in ["image", "media", "font"]:
                route.abort()
            else:
                route.continue_()

        page.route("**/**", block_resources)

        return page
