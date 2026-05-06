"""Contains the strategy to scrape offers from maxi.ca

Returns:
    _type_: a list of Offers for a search term
"""

from playwright.async_api import Locator, async_playwright
from app.schemas.offer import Offer
from app.helpers.page_reader import get_attr, get_text
from app.scrapers.maxi.normalizer import ScrapedOffer
from app.scrapers.maxi.config import PROVIDER_IDENTIFIER


def build_search_url(search_term: str) -> str:
    """Function to build the maxi.ca search url for the search term

    Args:
        search_term (str): The search term for the site

    Returns:
        str: The complete url for with the search term and the store
    """
    return f"https://www.maxi.ca/fr/search?search-bar={search_term}&storeId={PROVIDER_IDENTIFIER}"


async def parse_offer(item: Locator) -> ScrapedOffer:
    """Function to extract all the offer field from a specific page Locator

    Args:
        item (Locator): The locator

    Returns:
        Offer: The scraped offer built from the page locator
    """
    return ScrapedOffer(
        badge=await get_text(item.locator('[data-testid="product-badge"]')),
        external_id=await get_attr(item.locator('[data-testid="product-title"]'), "id"),
        url=await get_attr(item.locator("a"), "href"),
        brand=await get_text(item.locator('[data-testid="product-brand"]')),
        label=await get_text(item.locator('[data-testid="product-title"]')),
        _price=await get_text(item.locator('[data-testid="regular-price"]')),
        _package_size=await get_text(
            item.locator('[data-testid="product-package-size"]')
        ),
        image_url=await get_attr(item.locator("img").first, "src"),
    )


async def scrape(search_term: str) -> list[Offer]:
    """scrape maxi.ca for a specific search term and returns a list of offers

    Args:
        search_term (str): the search

    Returns:
        list[Offer]: the list of offers
    """
    offers = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(build_search_url(search_term))
        await page.wait_for_selector('[data-srp-feedback-added="true"]')
        items_selector = (
            '[data-testid="product-grid-component"] > [data-srp-feedback-added="true"]'
        )
        items = page.locator(items_selector)
        count = await items.count()

        for i in range(min(count, 10)):
            item = items.nth(i)
            offer = await parse_offer(item)

            print(f"=== {offer.badge}")
            print(f"=== {offer.brand}")
            print(f"=== {offer.external_id}")
            print(f"=== {offer.url}")
            print(f"=== {offer.label}")
            print(f"=== {offer.price}")
            print(f"=== {offer.package_size}")
            print(f"=== {offer.image_url}")
            print("=======================")

            if "Sponsorisé" == offer.badge:
                continue
            offers.append(offer.get_offer())

        await browser.close()
    return offers
