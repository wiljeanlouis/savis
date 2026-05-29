"""Extract Maxi offers from product list and product details HTML."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from typing import ClassVar

from bs4 import BeautifulSoup, Tag

from app.adapters.scrapers.utils import get_attr, get_text
from app.core.models import Offer, PackageSize, Price, Provider

from .provider import provider

logger = logging.getLogger(__name__)

MONEY_PATTERN = re.compile(r"([\d.,]+)\s*\$")
PACKAGE_SIZE_PATTERN = re.compile(r"^([\d.,]+)\s*([a-zA-Z]+)$")
UNIT_PRICE_PATTERN = re.compile(r"([\d.,]+)\s*\$\s*/\s*([\d.,]+)\s*([a-zA-Z]+)")
URL_EXTERNAL_ID_PATTERN = re.compile(r"/p/([^/?#]+)")


class Selectors:
    """CSS selectors used by the Maxi extractor."""

    PRODUCT_LIST_ITEM: ClassVar[str] = (
        '[data-testid="product-grid-component"] > [data-srp-feedback-added="true"]'
    )
    PRODUCT_DETAILS_ROOT: ClassVar[str] = (
        ".product-details-page-details__visibility-sensor"
    )
    PRODUCT_DETAILS_PRICE: ClassVar[str] = ".selling-price-list__item .price__value"
    PRODUCT_DETAILS_BRAND: ClassVar[str] = (
        ".product-name__item.product-name__item--brand"
    )
    PRODUCT_DETAILS_LABEL: ClassVar[str] = (
        ".product-name__item.product-name__item--name"
    )
    PRODUCT_DETAILS_PACKAGE_SIZE: ClassVar[str] = (
        ".product-name__item.product-name__item--package-size"
    )
    TRACK_PRODUCTS: ClassVar[str] = "[data-track-products-array]"
    PRODUCT_BADGE: ClassVar[str] = '[data-testid="product-badge"]'
    PRODUCT_TITLE: ClassVar[str] = '[data-testid="product-title"]'
    PRODUCT_BRAND: ClassVar[str] = '[data-testid="product-brand"]'
    PRODUCT_PACKAGE_SIZE: ClassVar[str] = '[data-testid="product-package-size"]'


ITEM_LIST_SELECTOR = Selectors.PRODUCT_LIST_ITEM
ITEM_SELECTOR = Selectors.PRODUCT_DETAILS_ROOT
PRICE_SELECTOR = Selectors.PRODUCT_DETAILS_PRICE


@dataclass(frozen=True)
class MaxiProductDraft:
    """Provider-shaped product data before it becomes a domain offer."""

    external_id: str
    url: str
    brand: str
    label: str
    price: Price | None
    package_size: PackageSize | None
    image_url: str = ""
    badge: str = ""

    def to_offer(self) -> Offer:
        """Convert extracted Maxi product data to the domain model."""
        return Offer(
            external_id=self.external_id,
            url=_absolute_url(self.url),
            brand=self.brand,
            label=self.label,
            price=self.price,
            package_size=self.package_size,
            image_url=self.image_url,
            provider=Provider(
                name=provider.name,
                identifier=provider.identifier,
                site=provider.website,
                address=provider.address,
            ),
        )


def parse_money(value: str) -> Price | None:
    """Parse a Maxi money string like ``6,25 $``."""
    match = MONEY_PATTERN.search(value)
    if not match:
        return None
    return Price(amount=_normalize_decimal_text(match.group(1)))


def parse_package_size(value: str) -> PackageSize | None:
    """Parse a package size string like ``2 l`` or ``500 g``."""
    match = PACKAGE_SIZE_PATTERN.search(value.strip())
    if not match:
        return None

    return PackageSize(
        value=float(_normalize_decimal_text(match.group(1))),
        unit=_normalize_unit(match.group(2)),
    )


def derive_total_price(
    package_size: PackageSize | None,
    unit_price: Price | None,
    reference_quantity: PackageSize | None,
) -> Price | None:
    """Derive a package price from a unit price and reference quantity."""
    if package_size is None or unit_price is None or reference_quantity is None:
        return None

    normalized_package_size = _as_base_unit(package_size)
    normalized_reference_quantity = _as_base_unit(reference_quantity)
    if normalized_package_size is None or normalized_reference_quantity is None:
        return None

    package_value, package_unit = normalized_package_size
    reference_value, reference_unit = normalized_reference_quantity
    if package_unit != reference_unit or reference_value == 0:
        return None

    amount = (Decimal(unit_price.amount) * package_value / reference_value).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )
    return Price(amount=format(amount, ".2f"), currency=unit_price.currency)


def extract_offer_from_product_list_html(search_term: str, html: str) -> list[Offer]:
    """Extract offers from Maxi search results HTML."""
    soup = BeautifulSoup(html, "lxml")
    items = soup.select(Selectors.PRODUCT_LIST_ITEM)
    logger.info("[MAXI] Found %s offers for %s", len(items), search_term)

    offers = []
    for item in items:
        draft = _product_list_draft(item)
        logger.info("[MAXI] Product list item extracted | %s", draft)
        offers.append(draft.to_offer())
    return offers


def extract_offer_from_product_details_html(url: str, html: str) -> Offer | None:
    """Extract one offer from Maxi product details HTML."""
    soup = BeautifulSoup(html, "lxml")
    item = soup.select_one(Selectors.PRODUCT_DETAILS_ROOT)
    if item is None:
        logger.info("[MAXI] Product details root not found for %s", url)
        return None

    draft = _product_details_draft(item, url)
    logger.info("[MAXI] Product details item extracted | %s", draft)
    return draft.to_offer()


def _product_list_draft(item: Tag) -> MaxiProductDraft:
    package_price_info = get_text(item.select_one(Selectors.PRODUCT_PACKAGE_SIZE))
    package_size = _parse_package_size_from_package_price_info(package_price_info)
    unit_price, reference_quantity = _parse_unit_price_info(package_price_info)

    return MaxiProductDraft(
        badge=get_text(item.select_one(Selectors.PRODUCT_BADGE)),
        external_id=get_attr(item.select_one(Selectors.PRODUCT_TITLE), "id"),
        url=get_attr(item.select_one("a"), "href"),
        brand=get_text(item.select_one(Selectors.PRODUCT_BRAND)),
        label=get_text(item.select_one(Selectors.PRODUCT_TITLE)),
        image_url=get_attr(item.select_one("img"), "src"),
        package_size=package_size,
        price=derive_total_price(package_size, unit_price, reference_quantity),
    )


def _product_details_draft(item: Tag, url: str) -> MaxiProductDraft:
    package_size = parse_package_size(
        get_text(item.select_one(Selectors.PRODUCT_DETAILS_PACKAGE_SIZE)),
    )

    return MaxiProductDraft(
        external_id=_extract_external_id(item, url),
        url=url,
        brand=get_text(item.select_one(Selectors.PRODUCT_DETAILS_BRAND)),
        label=get_text(item.select_one(Selectors.PRODUCT_DETAILS_LABEL)),
        price=parse_money(get_text(item.select_one(Selectors.PRODUCT_DETAILS_PRICE))),
        package_size=package_size,
    )


def _parse_package_size_from_package_price_info(value: str) -> PackageSize | None:
    package_size_text = value.split(",", maxsplit=1)[0]
    return parse_package_size(package_size_text)


def _parse_unit_price_info(value: str) -> tuple[Price | None, PackageSize | None]:
    match = UNIT_PRICE_PATTERN.search(value)
    if not match:
        return None, None

    unit_price = Price(amount=_normalize_decimal_text(match.group(1)))
    reference_quantity = PackageSize(
        value=float(_normalize_decimal_text(match.group(2))),
        unit=_normalize_unit(match.group(3)),
    )
    return unit_price, reference_quantity


def _extract_external_id(item: Tag, url: str) -> str:
    track_products = get_attr(
        item.select_one(Selectors.TRACK_PRODUCTS),
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


def _absolute_url(url: str) -> str:
    if url.startswith(("http://", "https://")):
        return url
    return f"{provider.website}{url}"


def _normalize_decimal_text(value: str) -> str:
    return value.replace(",", ".")


def _normalize_unit(unit: str) -> str:
    normalized_unit = unit.lower()
    if normalized_unit in {"ch", "ea"}:
        return "piece"
    return normalized_unit


def _as_base_unit(package_size: PackageSize) -> tuple[Decimal, str] | None:
    conversion_factors = {
        "g": (Decimal(1), "g"),
        "kg": (Decimal(1000), "g"),
        "ml": (Decimal(1), "ml"),
        "l": (Decimal(1000), "ml"),
        "piece": (Decimal(1), "piece"),
    }
    conversion = conversion_factors.get(package_size.unit.lower())
    if conversion is None:
        return None

    factor, base_unit = conversion
    return Decimal(str(package_size.value)) * factor, base_unit
