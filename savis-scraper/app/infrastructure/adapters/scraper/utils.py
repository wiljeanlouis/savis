import unicodedata
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from playwright.async_api import Locator


async def get_text(locator: Locator, default: str = "") -> str:
    try:
        value = await locator.inner_text()
        clean_text = unicodedata.normalize("NFKD", value)
        return clean_text.strip()
    except:
        return default


async def get_attr(locator: Locator, name: str, default: str = "") -> str:
    try:
        value = await locator.get_attribute(name)
        return value or default
    except:
        return default


async def get_image_src(item):
    img = item.locator("img").first
    await img.wait_for()

    return await img.get_attribute("src") or ""
