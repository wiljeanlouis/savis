class BrowserManager:

    def __init__(self):
        self.browser = None
        self.playwright = None

    async def start(self):
        if not self.browser:
            from playwright.async_api import async_playwright

            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(headless=True)

    async def get_page(self):
        context = await self.browser.new_context()
        return await context.new_page()
