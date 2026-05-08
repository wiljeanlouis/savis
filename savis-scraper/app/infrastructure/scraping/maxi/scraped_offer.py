"""Scraper model for Maxi offers."""

import re
from dataclasses import dataclass

from app.domain.models.offer import Offer, PackageSize, Price, Provider
from app.infrastructure.scraping.maxi.config import (
    PROVIDER_ADDRESS,
    PROVIDER_IDENTIFIER,
    PROVIDER_NAME,
    PROVIDER_SITE,
)

PATTERN = r"\s*(\d+,\d+)\s*(\$)/(\d+)([a-zA-Z]+)"


@dataclass
class ScrapedOffer:
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
                name=PROVIDER_NAME,
                identifier=PROVIDER_IDENTIFIER,
                site=PROVIDER_SITE,
                address=PROVIDER_ADDRESS,
            ),
        )
