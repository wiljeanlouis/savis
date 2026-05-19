"""Tests for Maxi offer extraction helpers."""

# ruff: noqa: D103, S101

from app.adapters.scrapers.maxi.extractor import MaxiOffer
from app.core.models import Price


def test_get_offer_derives_total_price_from_unit_price() -> None:
    maxi_offer = MaxiOffer(
        badge="",
        external_id="external-id",
        url="https://example.com/offer",
        brand="Example",
        label="Flour",
        _package_price_info="500 g, 2,50 $/100g",
        image_url="https://example.com/image.png",
    )

    offer = maxi_offer.get_offer()

    assert offer.price == Price(amount="12.50")


def test_derive_total_price_converts_kg_to_g() -> None:
    maxi_offer = _maxi_offer("1 kg, 2,50 $/100g")

    assert maxi_offer.price == Price(amount="25.00")


def test_derive_total_price_converts_g_to_kg() -> None:
    maxi_offer = _maxi_offer("10 g, 10,00 $/1kg")

    assert maxi_offer.price == Price(amount="0.10")


def test_derive_total_price_converts_l_to_ml() -> None:
    maxi_offer = _maxi_offer("1 l, 0,25 $/100ml")

    assert maxi_offer.price == Price(amount="2.50")


def test_derive_total_price_converts_ml_to_l() -> None:
    maxi_offer = _maxi_offer("500 ml, 4,00 $/1l")

    assert maxi_offer.price == Price(amount="2.00")


def test_derive_total_price_rounds_to_two_decimals() -> None:
    maxi_offer = _maxi_offer("333 g, 1,00 $/100g")

    assert maxi_offer.price == Price(amount="3.33")


def test_derive_total_price_returns_none_for_incompatible_units() -> None:
    maxi_offer = _maxi_offer("1 l, 2,50 $/100g")

    assert maxi_offer.price is None


def test_get_offer_keeps_price_empty_when_required_data_is_missing() -> None:
    maxi_offer = MaxiOffer(
        badge="",
        external_id="external-id",
        url="https://example.com/offer",
        brand="Example",
        label="Flour",
        _package_price_info="",
        image_url="https://example.com/image.png",
    )

    offer = maxi_offer.get_offer()

    assert offer.price is None


def _maxi_offer(package_price_info: str) -> MaxiOffer:
    return MaxiOffer(
        badge="",
        external_id="external-id",
        url="https://example.com/offer",
        brand="Example",
        label="Flour",
        _package_price_info=package_price_info,
        image_url="https://example.com/image.png",
    )
