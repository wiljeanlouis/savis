from pydantic import BaseModel


class PackageSize(BaseModel):
    value: float
    unit: str


class Price(BaseModel):
    amount: str
    currency: str = "CAD"


class Provider(BaseModel):
    name: str
    identifier: str
    site: str
    address: str


class Offer(BaseModel):
    externalId: str
    url: str
    brand: str
    label: str
    price: Price | None
    packageSize: PackageSize | None
    imageUrl: str
    provider: Provider
