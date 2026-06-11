"""Tests for Maxi offer extraction helpers."""

# ruff: noqa: D103, S101
from app.adapters.scrapers.maxi.extractor import (
    MaxiProductDraft,
    derive_total_price,
    extract_offer_from_product_details_html,
    parse_package_size,
)
from app.core.models import PackageSize, Price

from .html_loader import load_product_details_page_html

RELATIVE_OFFER_URL = "/fr/farine/p/12345"
FULL_OFFER_URL = "https://maxi.ca/fr/farine/p/12345"
PRODUCT_DETAILS_URL = (
    "https://maxi.ca/fr/produit-laitier-sans-lactose-2/p/20077874001_EA"
)

PRODUCT_DETAILS_HTML = load_product_details_page_html()


def test_get_offer_derives_total_price_from_unit_price() -> None:
    draft = MaxiProductDraft(
        external_id="external-id",
        url=RELATIVE_OFFER_URL,
        brand="Example",
        label="Flour",
        package_size=PackageSize(value=500, unit="g"),
        price=Price(amount="12.50"),
        image_url="https://example.com/image.png",
    )

    offer = draft.to_offer()

    assert offer.url == FULL_OFFER_URL
    assert offer.price == Price(amount="12.50")


def test_derive_total_price_converts_kg_to_g() -> None:
    price = _derive_total_price("1 kg", "2.50", "100 g")

    assert price == Price(amount="25.00")


def test_derive_total_price_converts_g_to_kg() -> None:
    price = _derive_total_price("10 g", "10.00", "1 kg")

    assert price == Price(amount="0.10")


def test_derive_total_price_converts_l_to_ml() -> None:
    price = _derive_total_price("1 l", "0.25", "100 ml")

    assert price == Price(amount="2.50")


def test_derive_total_price_converts_ml_to_l() -> None:
    price = _derive_total_price("500 ml", "4.00", "1 l")

    assert price == Price(amount="2.00")


def test_parse_package_size_converts_maxi_each_units_to_piece() -> None:
    assert parse_package_size("1 ch") == PackageSize(value=1.0, unit="piece")
    assert parse_package_size("1 ea") == PackageSize(value=1.0, unit="piece")


def test_derive_total_price_converts_maxi_each_units_to_piece() -> None:
    price = _derive_total_price("6 ch", "2.00", "1 ea")

    assert price == Price(amount="12.00")


def test_derive_total_price_rounds_to_two_decimals() -> None:
    price = _derive_total_price("333 g", "1.00", "100 g")

    assert price == Price(amount="3.33")


def test_derive_total_price_returns_none_for_incompatible_units() -> None:
    price = _derive_total_price("1 l", "2.50", "100 g")

    assert price is None


def test_get_offer_keeps_price_empty_when_required_data_is_missing() -> None:
    draft = MaxiProductDraft(
        external_id="external-id",
        url=RELATIVE_OFFER_URL,
        brand="Example",
        label="Flour",
        package_size=None,
        price=None,
        image_url="https://example.com/image.png",
    )

    offer = draft.to_offer()

    assert offer.price is None


def test_extract_offer_from_product_details_html() -> None:
    offer = extract_offer_from_product_details_html(
        PRODUCT_DETAILS_URL,
        PRODUCT_DETAILS_HTML,
    )

    assert offer is not None
    assert offer.external_id == "20077874001_EA"
    assert offer.url == PRODUCT_DETAILS_URL
    assert offer.brand == "Natrel"
    assert offer.label == "Produit laitier sans lactose 2 %"
    assert offer.price == Price(amount="6.49")
    assert offer.package_size == PackageSize(value=2.0, unit="l")
    assert offer.image_url == (
        "https://digital.loblaws.ca/PCX/20077874001_EA/fr/1/"
        "20077874001_fr_front_800.png"
    )


def test_extract_offer_uses_first_original_slider_image() -> None:
    html = """
    <div class="product-details-page-details">
      <div class="slick-slide slick-cloned" data-index="-1">
        <img class="responsive-image--product-details-page"
             src="https://example.com/last-image-clone.png">
      </div>
      <div class="slick-slide" data-index="0">
        <img class="responsive-image--product-details-page"
             src="https://example.com/main-image.png">
      </div>
      <div class="slick-slide slick-active slick-current" data-index="1">
        <img class="responsive-image--product-details-page"
             src="https://example.com/active-secondary-image.png">
      </div>
      <span class="product-name__item--brand">Five Roses</span>
      <h1 class="product-name__item--name">Farine blanche tout usage</h1>
      <span class="product-name__item--package-size">2.5 kg</span>
      <div class="selling-price-list__item">
        <span class="price__value">6,29 $</span>
      </div>
    </div>
    """

    offer = extract_offer_from_product_details_html(PRODUCT_DETAILS_URL, html)

    assert offer is not None
    assert offer.image_url == "https://example.com/main-image.png"


def _derive_total_price(
    package_size: str,
    unit_price: str,
    reference_quantity: str,
) -> Price | None:
    return derive_total_price(
        parse_package_size(package_size),
        Price(amount=unit_price),
        parse_package_size(reference_quantity),
    )
