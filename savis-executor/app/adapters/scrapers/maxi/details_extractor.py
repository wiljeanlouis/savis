"""Extract one Maxi offer from product details HTML."""

import json
import logging
import re
from typing import TYPE_CHECKING, ClassVar

from bs4 import BeautifulSoup, Tag

from app.adapters.scrapers.utils import get_attr, get_text

from .models import MaxiProductDraft
from .parsing import parse_money, parse_package_size

if TYPE_CHECKING:
    from app.core.models import Offer, PackageSize

logger = logging.getLogger(__name__)

URL_EXTERNAL_ID_PATTERN = re.compile(r"/p/([^/?#]+)")


class DetailsSelectors:
    """CSS selectors used for Maxi product details."""

    ROOT: ClassVar[str] = ".product-details-page-details"
    PRICE: ClassVar[str] = ".selling-price-list__item .price__value"
    TRACK_PRODUCTS: ClassVar[str] = "[data-track-products-array]"
    BRAND: ClassVar[str] = ".product-name__item.product-name__item--brand"
    LABEL: ClassVar[str] = ".product-name__item.product-name__item--name"
    PACKAGE_SIZE: ClassVar[str] = (
        ".product-name__item.product-name__item--package-size"
    )
    COMPARISON_PRICE_UNIT: ClassVar[str] = (
        ".comparison-price-list__item__price__unit"
    )
    IMAGE: ClassVar[str] = ".responsive-image--product-details-page"
    PRIMARY_SLIDE_IMAGE: ClassVar[str] = (
        '.slick-slide[data-index="0"]:not(.slick-cloned) '
        ".responsive-image--product-details-page"
    )


ITEM_SELECTOR = DetailsSelectors.PRICE


def extract_offer_from_product_details_html(url: str, html: str) -> Offer | None:
    """Extract one offer from Maxi product details HTML."""
    soup = BeautifulSoup(html, "lxml")
    item = soup.select_one(DetailsSelectors.ROOT)
    if item is None:
        logger.info("[MAXI] Product details root not found for %s", url)
        return None

    draft = _product_details_draft(item, url)
    logger.info("[MAXI] Product details item extracted | %s", draft)
    return draft.to_offer()


def _product_details_draft(item: Tag, url: str) -> MaxiProductDraft:
    return MaxiProductDraft(
        external_id=_extract_external_id(item, url),
        url=url,
        brand=get_text(item.select_one(DetailsSelectors.BRAND)),
        label=get_text(item.select_one(DetailsSelectors.LABEL)),
        price=parse_money(get_text(item.select_one(DetailsSelectors.PRICE))),
        package_size=_extract_package_size(item),
        image_url=_extract_image_url(item),
    )


def _extract_package_size(item: Tag) -> PackageSize | None:
    package_size = parse_package_size(
        get_text(item.select_one(DetailsSelectors.PACKAGE_SIZE)),
    )
    if package_size is not None:
        return package_size

    for unit_element in item.select(DetailsSelectors.COMPARISON_PRICE_UNIT):
        reference_quantity = parse_package_size(
            get_text(unit_element).removeprefix("/").strip(),
        )
        if reference_quantity is not None and reference_quantity.unit in {
            "g",
            "kg",
            "l",
            "ml",
        }:
            return reference_quantity
    return None


def _extract_image_url(item: Tag) -> str:
    primary_slide_image = item.select_one(DetailsSelectors.PRIMARY_SLIDE_IMAGE)
    image = primary_slide_image or item.select_one(DetailsSelectors.IMAGE)
    return get_attr(image, "src")


def _extract_external_id(item: Tag, url: str) -> str:
    track_products = get_attr(
        item.select_one(DetailsSelectors.TRACK_PRODUCTS),
        "data-track-products-array",
    )
    if track_products:
        try:
            products = json.loads(track_products)
        except json.JSONDecodeError:
            products = []

        if products:
            product_sku = products[0].get("productSKU")
            if product_sku:
                return str(product_sku)

    url_match = URL_EXTERNAL_ID_PATTERN.search(url)
    if url_match:
        return url_match.group(1)
    return url
