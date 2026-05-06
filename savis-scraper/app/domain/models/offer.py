from dataclasses import dataclass


@dataclass
class PackageSize:
    value: float
    unit: str


@dataclass
class Price:
    amount: str
    currency: str = "CAD"


@dataclass
class Provider:
    name: str
    identifier: str
    site: str
    address: str


@dataclass
class Offer:
    externalId: str
    url: str
    brand: str
    label: str
    price: Price | None
    packageSize: PackageSize | None
    imageUrl: str
    provider: Provider
