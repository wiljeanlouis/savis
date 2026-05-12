import unicodedata
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from bs4 import Tag


def get_text(tag: Tag | None, default: str = "") -> str:
    if not tag:
        return default
    try:
        value = tag.get_text(strip=True)
        return unicodedata.normalize("NFKD", value)
    except:
        return default


def get_attr(tag: Tag | None, name: str, default: str = "") -> str | Any:
    if not tag:
        return default
    try:
        value = tag.get(name)
        return value or default
    except:
        return default


# def get_image_src(item):
#     img = item.locator("img").first
#     img.wait_for()

#     return img.get_attribute("src") or ""
