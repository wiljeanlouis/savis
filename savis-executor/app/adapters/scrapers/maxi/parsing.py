"""Shared parsing helpers for Maxi extractors."""

import re
from decimal import ROUND_HALF_UP, Decimal

from app.core.models import PackageSize, Price

MONEY_PATTERN = re.compile(r"([\d.,]+)\s*\$")
PACKAGE_SIZE_PATTERN = re.compile(r"^([\d.,]+)\s*([a-zA-Z]+)$")


def parse_money(value: str) -> Price | None:
    """Parse a Maxi money string like ``6,25 $``."""
    match = MONEY_PATTERN.search(value)
    if not match:
        return None
    return Price(amount=normalize_decimal_text(match.group(1)))


def parse_package_size(value: str) -> PackageSize | None:
    """Parse a package size string like ``2 l`` or ``500 g``."""
    match = PACKAGE_SIZE_PATTERN.search(value.strip())
    if not match:
        return None

    return PackageSize(
        value=float(normalize_decimal_text(match.group(1))),
        unit=normalize_unit(match.group(2)),
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


def normalize_decimal_text(value: str) -> str:
    """Normalize a localized decimal for domain model construction."""
    return value.replace(",", ".")


def normalize_unit(unit: str) -> str:
    """Normalize provider-specific unit labels."""
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
