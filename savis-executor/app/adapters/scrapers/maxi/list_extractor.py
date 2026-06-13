"""Extract Maxi offers from product list HTML."""

import logging
import re
from typing import ClassVar

from bs4 import BeautifulSoup, Tag

from app.adapters.scrapers.utils import get_attr, get_text
from app.core.models import Offer, PackageSize, Price

from .models import MaxiProductDraft
from .parsing import (
    derive_total_price,
    normalize_decimal_text,
    normalize_unit,
    parse_package_size,
)

logger = logging.getLogger(__name__)

UNIT_PRICE_PATTERN = re.compile(r"([\d.,]+)\s*\$\s*/\s*([\d.,]+)\s*([a-zA-Z]+)")


class ListSelectors:
    """CSS selectors used for Maxi search results."""

    PRODUCT_LIST_ITEM: ClassVar[str] = (
        '[data-testid="product-grid-component"] > [data-srp-feedback-added="true"]'
    )
    PRODUCT_BADGE: ClassVar[str] = '[data-testid="product-badge"]'
    PRODUCT_TITLE: ClassVar[str] = '[data-testid="product-title"]'
    PRODUCT_BRAND: ClassVar[str] = '[data-testid="product-brand"]'
    PRODUCT_PACKAGE_SIZE: ClassVar[str] = '[data-testid="product-package-size"]'


ITEM_LIST_SELECTOR = ListSelectors.PRODUCT_LIST_ITEM


def extract_offer_from_product_list_html(search_term: str, html: str) -> list[Offer]:
    """Extract offers from Maxi search results HTML."""
    soup = BeautifulSoup(html, "lxml")
    items = soup.select(ListSelectors.PRODUCT_LIST_ITEM)
    logger.info("[MAXI] Found %s offers for %s", len(items), search_term)

    offers = []
    for item in items:
        draft = _product_list_draft(item)
        logger.info("[MAXI] Product list item extracted | %s", draft)
        offers.append(draft.to_offer())
    return offers


def _product_list_draft(item: Tag) -> MaxiProductDraft:
    package_price_info = get_text(item.select_one(ListSelectors.PRODUCT_PACKAGE_SIZE))
    package_size = _parse_package_size_from_package_price_info(package_price_info)
    unit_price, reference_quantity = _parse_unit_price_info(package_price_info)

    return MaxiProductDraft(
        badge=get_text(item.select_one(ListSelectors.PRODUCT_BADGE)),
        external_id=get_attr(item.select_one(ListSelectors.PRODUCT_TITLE), "id"),
        url=get_attr(item.select_one("a"), "href"),
        brand=get_text(item.select_one(ListSelectors.PRODUCT_BRAND)),
        label=get_text(item.select_one(ListSelectors.PRODUCT_TITLE)),
        image_url=get_attr(item.select_one("img"), "src"),
        package_size=package_size,
        price=derive_total_price(package_size, unit_price, reference_quantity),
    )


def _parse_package_size_from_package_price_info(value: str) -> PackageSize | None:
    package_size_text = value.split(",", maxsplit=1)[0]
    return parse_package_size(package_size_text)


def _parse_unit_price_info(value: str) -> tuple[Price | None, PackageSize | None]:
    match = UNIT_PRICE_PATTERN.search(value)
    if not match:
        return None, None

    unit_price = Price(amount=normalize_decimal_text(match.group(1)))
    reference_quantity = PackageSize(
        value=float(normalize_decimal_text(match.group(2))),
        unit=normalize_unit(match.group(3)),
    )
    return unit_price, reference_quantity
