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
    """Represents a product offer with pricing and provider details.

    Attributes
    ----------
    external_id : str
        The external identifier for the offer.
    url : str
        The URL of the offer.
    brand : str
        The brand of the product.
    label : str
        The label or name of the product.
    price : Price
        The total price
    package_size : PackageSize
        The total amount of the product
    unit_price : Price
        The comparison price
    reference_quantity : PackageSize
        The base amount of the unit price
    image_url : str
        The URL of the product image.
    provider: str
        The provider

    """

    external_id: str
    url: str
    brand: str
    label: str
    price: Price | None
    package_size: PackageSize | None
    unit_price: Price | None
    reference_quantity: PackageSize | None
    image_url: str
    provider: Provider
