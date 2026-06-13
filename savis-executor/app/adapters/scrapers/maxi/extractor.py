"""Compatibility exports for Maxi extraction."""

from .details_extractor import (
    ITEM_SELECTOR,
    extract_offer_from_product_details_html,
)
from .list_extractor import (
    ITEM_LIST_SELECTOR,
    extract_offer_from_product_list_html,
)
from .models import MaxiProductDraft
from .parsing import derive_total_price, parse_money, parse_package_size

__all__ = [
    "ITEM_LIST_SELECTOR",
    "ITEM_SELECTOR",
    "MaxiProductDraft",
    "derive_total_price",
    "extract_offer_from_product_details_html",
    "extract_offer_from_product_list_html",
    "parse_money",
    "parse_package_size",
]
