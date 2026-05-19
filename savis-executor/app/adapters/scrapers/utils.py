"""Helpers for extracting values from HTML tags."""

import unicodedata
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from bs4 import Tag


def get_text(tag: Tag | None, default: str = "") -> str:
    """Extract normalized text from a BeautifulSoup tag."""
    if not tag:
        return default
    try:
        value = tag.get_text(strip=True)
        return unicodedata.normalize("NFKD", value)
    except Exception:  # noqa: BLE001
        return default


def get_attr(tag: Tag | None, name: str, default: str = "") -> str:
    """Extract an attribute value from a BeautifulSoup tag."""
    if not tag:
        return default
    try:
        value = tag.get(name)
    except Exception:  # noqa: BLE001
        return default

    if value is None:
        return default
    if isinstance(value, list):
        return " ".join(str(item) for item in value)
    return str(value)
