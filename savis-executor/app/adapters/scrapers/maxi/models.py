"""Maxi-specific extraction models."""

from dataclasses import dataclass

from app.core.models import Offer, PackageSize, Price, Provider

from .provider import provider


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


def _absolute_url(url: str) -> str:
    if url.startswith(("http://", "https://")):
        return url
    return f"{provider.website}{url}"
