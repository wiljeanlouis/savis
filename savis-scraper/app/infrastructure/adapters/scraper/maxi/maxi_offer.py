"""Scraper model for Maxi offers."""

import re
from dataclasses import dataclass
from typing import TYPE_CHECKING

from app.domain.models import Offer, PackageSize, Price, Provider
from app.infrastructure.adapters.scraper.utils import get_attr, get_text

from .maxi_provider import provider

if TYPE_CHECKING:
    from playwright.sync_api import Locator


PATTERN = r"\s*(\d+,\d+)\s*(\$)/(\d+)([a-zA-Z]+)"


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
    _price : str
        The raw price string.
    _package_size : str
        The raw package size string.
    image_url : str
        The URL of the product image.

    """

    badge: str
    external_id: str
    url: str
    brand: str
    label: str
    _price: str
    _package_size: str
    image_url: str

    def __post_init__(self) -> None:
        """Parse raw price and package size strings after initialization."""
        match = re.search(PATTERN, self._package_size)
        self.price = None
        self.package_size = None

        if match:
            price_amount = match.group(1)
            price_unit = match.group(2)
            package_price_value = match.group(3)
            unit_reference = match.group(4)

            if price_amount and price_unit:
                self.price = Price(amount=price_amount)

            if package_price_value and unit_reference:
                self.package_size = PackageSize(
                    value=float(package_price_value),
                    unit=unit_reference,
                )

    def extract_offer(self) -> Offer:
        """Extract and return an Offer object from the scraped data."""
        return Offer(
            external_id=self.external_id,
            url=self.url,
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
         -   {self.badge}
         -   {self.brand}
         -   {self.external_id}
         -   {self.url}
         -   {self.label}
         -   {self.price}
         -   {self.package_size}
         -   {self.image_url}
        """


def maxi_offer_builder(item: Locator) -> MaxiOffer:
    """Extract all the offer field from a specific page Locator.

    Args:
        item (Locator): The locator

    Returns:
        Offer: The scraped offer built from the page locator

    """
    return MaxiOffer(
        badge=get_text(item.locator('[data-testid="product-badge"]')),
        external_id=get_attr(
            item.locator('[data-testid="product-title"]'),
            "id",
        ),
        url=get_attr(item.locator("a"), "href"),
        brand=get_text(item.locator('[data-testid="product-brand"]')),
        label=get_text(item.locator('[data-testid="product-title"]')),
        _price=get_text(item.locator('[data-testid="regular-price"]')),
        _package_size=get_text(
            item.locator('[data-testid="product-package-size"]'),
        ),
        image_url=get_attr(item.locator("img").first, "src"),
    )
