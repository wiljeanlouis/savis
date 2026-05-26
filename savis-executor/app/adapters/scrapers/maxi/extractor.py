"""Scraper module for Maxi offers."""

import logging
import re
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from bs4 import BeautifulSoup, Tag

from app.adapters.scrapers.utils import get_attr, get_text
from app.core.models import Offer, PackageSize, Price, Provider

from .provider import provider

PRICE_PATTERN = r"\s*(\d+,\d+)\s*(\$)/(\d+)([a-zA-Z]+)"
PACKAGE_SIZE_PATTERN = r"([\d.,]+)\s*([a-zA-Z]+),\s*"

logger = logging.getLogger(__name__)


@dataclass
class MaxiOffer:
    """Represents a scraped offer from Maxi provider.

    Attributes
    ----------
    badge : str
        The badge associated with the offer.
    external_id : str
        The external identifier for the offer.
    url : str
        The URL of the offer.
    brand : str
        The brand of the product.
    label : str
        The label or name of the product.
    _package_price_info : str
        The raw package size string.
    image_url : str
        The URL of the product image.

    """

    badge: str
    external_id: str
    url: str
    brand: str
    label: str
    _package_price_info: str
    image_url: str
    price: Price | None = None
    package_size: PackageSize | None = None
    unit_price: Price | None = None
    reference_quantity: PackageSize | None = None

    def __post_init__(self) -> None:
        """Parse raw price and package size strings after initialization."""
        _set_unit_price_and_reference_quantity(self, self._package_price_info)
        _set_package_size(self, self._package_price_info)
        _set_price(self)

    def get_offer(self) -> Offer:
        """Extract and return an Offer object from the scraped data."""
        return Offer(
            external_id=self.external_id,
            url=self.url
            if self.url.startswith(("http://", "https://"))
            else f"{provider.website}{self.url}",
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

    def __repr__(self) -> str:
        """Return a string representation of the MaxiOffer."""
        return f"""
         - Badge:  {self.badge}
         - Brand:  {self.brand}
         - External Id:  {self.external_id}
         - Url:  {self.url}
         - Label:  {self.label}
         - Price:  {self.price}
         - Package size:  {self.package_size}
         - Unit price:  {self.unit_price}
         - Reference quantity:  {self.reference_quantity}
         - Image url:  {self.image_url}
        """


def _set_unit_price_and_reference_quantity(
    self: MaxiOffer,
    package_price_info: str,
) -> None:
    """Set the price and the package_price from package_price_info.

    Args:
        self (MaxiOffer): the MaxiOffer object
        package_price_info (str): the string to extract values from

    """
    price_match = re.search(PRICE_PATTERN, package_price_info)

    if price_match:
        price_amount = price_match.group(1)
        price_unit = price_match.group(2)
        package_price_value = price_match.group(3)
        unit_reference = price_match.group(4)

        if price_amount and price_unit:
            self.unit_price = Price(amount=price_amount.replace(",", "."))

        if package_price_value and unit_reference:
            self.reference_quantity = PackageSize(
                value=float(package_price_value),
                unit=unit_reference,
            )


def _set_package_size(self: MaxiOffer, package_price_info: str) -> None:
    """Set the package size from package_price_info.

    Args:
    self (MaxiOffer): the MaxiOffer object
    package_price_info (str): the string to extract values from

    """
    package_size_match = re.search(PACKAGE_SIZE_PATTERN, package_price_info)

    if package_size_match:
        package_size_value = package_size_match.group(1)
        package_unit_value = package_size_match.group(2)

        if package_size_value and package_unit_value:
            self.package_size = PackageSize(
                value=float(package_size_value),
                unit=package_unit_value,
            )


def _set_price(self: MaxiOffer) -> None:
    """Derive Maxi total price from normalized package information."""
    if (
        self.package_size is None
        or self.unit_price is None
        or self.reference_quantity is None
    ):
        return

    package_size = _as_base_unit(self.package_size)
    reference_quantity = _as_base_unit(self.reference_quantity)
    if package_size is None or reference_quantity is None:
        return

    package_value, package_unit = package_size
    reference_value, reference_unit = reference_quantity
    if package_unit != reference_unit or reference_value == 0:
        return

    amount = (
        Decimal(self.unit_price.amount) * package_value / reference_value
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    self.price = Price(
        amount=format(amount, ".2f"),
        currency=self.unit_price.currency,
    )


def _as_base_unit(package_size: PackageSize) -> tuple[Decimal, str] | None:
    normalized_unit = package_size.unit.lower()
    conversion_factors = {
        "g": (Decimal(1), "g"),
        "kg": (Decimal(1000), "g"),
        "ml": (Decimal(1), "ml"),
        "l": (Decimal(1000), "ml"),
        "ch": (Decimal(1), "ch"),
        "ea": (Decimal(1), "ch"),
    }
    conversion = conversion_factors.get(normalized_unit)
    if conversion is None:
        return None

    factor, base_unit = conversion
    return Decimal(str(package_size.value)) * factor, base_unit


def _maxi_offer_builder(item: Tag) -> MaxiOffer:
    """Extract all the offer fields from a specific Tag.

    Args:
        item (Tag): The tag

    Returns:
        Offer: The scraped offer built from the tag

    """
    return MaxiOffer(
        badge=get_text(item.select_one('[data-testid="product-badge"]')),
        external_id=get_attr(
            item.select_one('[data-testid="product-title"]'),
            "id",
        ),
        url=get_attr(item.select_one("a"), "href"),
        brand=get_text(item.select_one('[data-testid="product-brand"]')),
        label=get_text(item.select_one('[data-testid="product-title"]')),
        _package_price_info=get_text(
            item.select_one('[data-testid="product-package-size"]'),
        ),
        image_url=get_attr(item.select_one("img"), "src"),
    )


def extract_offers(search_term: str, html: str) -> list[Offer]:
    """Extract all the offers from the html."""
    offers = []
    soup = BeautifulSoup(html, "lxml")

    items_selector = (
        '[data-testid="product-grid-component"] > [data-srp-feedback-added="true"]'
    )
    items = soup.select(items_selector)

    logger.info("[MAXI] Found %s offers for %s", len(items), search_term)

    for item in items:
        maxi_offer = _maxi_offer_builder(item)

        logger.info("{%s}", maxi_offer)

        if maxi_offer.badge == "Sponsorisé":
            continue

        offers.append(maxi_offer.get_offer())

    return offers
