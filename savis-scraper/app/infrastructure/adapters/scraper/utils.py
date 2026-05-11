import unicodedata
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from playwright.sync_api import Locator


def get_text(locator: Locator, default: str = "") -> str:
    try:
        value = locator.inner_text()
        clean_text = unicodedata.normalize("NFKD", value)
        return clean_text.strip()
    except:
        return default


def get_attr(locator: Locator, name: str, default: str = "") -> str:
    try:
        value = locator.get_attribute(name)
        return value or default
    except:
        return default


def get_image_src(item):
    img = item.locator("img").first
    img.wait_for()

    return img.get_attribute("src") or ""
