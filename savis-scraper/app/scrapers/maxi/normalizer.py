import re
from dataclasses import dataclass
from app.schemas.offer import Offer, Price, PackageSize, Provider
from app.scrapers.maxi.config import (
    PROVIDER_NAME,
    PROVIDER_IDENTIFIER,
    PROVIDER_SITE,
    PROVIDER_ADDRESS,
)

PATTERN = r"\s*(\d+,\d+)\s*(\$)/(\d+)([a-zA-Z]+)"


@dataclass
class ScrapedOffer:
    badge: str
    external_id: str
    url: str
    brand: str
    label: str
    _price: str
    _package_size: str
    image_url: str

    def __init__(
        self,
        badge: str,
        external_id: str,
        url: str,
        brand: str,
        label: str,
        _price: str,
        _package_size: str,
        image_url: str,
    ) -> None:
        self.badge = badge
        self.external_id = external_id
        self.url = url
        self.brand = brand
        self.label = label
        self._price = _price
        self._package_size = _package_size
        self.image_url = image_url

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
                    value=float(package_price_value), unit=unit_reference
                )

    def get_offer(self) -> Offer:
        return Offer(
            externalId=self.external_id,
            url=self.url,
            brand=self.brand,
            label=self.label,
            price=self.price,
            packageSize=self.package_size,
            imageUrl=self.image_url,
            provider=Provider(
                name=PROVIDER_NAME,
                identifier=PROVIDER_IDENTIFIER,
                site=PROVIDER_SITE,
                address=PROVIDER_ADDRESS,
            ),
        )
