"""Domain models for product offers."""

from dataclasses import dataclass


@dataclass
class PackageSize:
    """Represents the size of a product package."""

    value: float
    unit: str


@dataclass
class Price:
    """Represents the price of a product offer."""

    amount: str
    currency: str = "CAD"


@dataclass
class Provider:
    """Represents the provider of a product offer."""

    name: str
    identifier: str
    site: str
    address: str


@dataclass
class Offer:
    """Represents a product offer with pricing and provider details."""

    external_id: str
    url: str
    brand: str
    label: str
    price: Price | None
    package_size: PackageSize | None
    image_url: str
    provider: Provider
