"""Tests for Maxi offer extraction helpers."""

# ruff: noqa: D103, S101

from app.adapters.scrapers.maxi.extractor import (
    MaxiProductDraft,
    derive_total_price,
    extract_offer_from_product_details_html,
    parse_package_size,
)
from app.core.models import PackageSize, Price

RELATIVE_OFFER_URL = "/fr/farine/p/12345"
FULL_OFFER_URL = "https://maxi.ca/fr/farine/p/12345"
PRODUCT_DETAILS_URL = (
    "https://maxi.ca/fr/produit-laitier-sans-lactose-2/p/20077874001_EA"
)
PRODUCT_DETAILS_HTML = """
<div class="product-details-page-details__visibility-sensor">
  <div class="flex w-fit items-center">Préparé au Canada</div>
  <div class="product-name product-name--product-details-page">
    <span class="product-name__item product-name__item--brand">Natrel</span>
    <h1 class="product-name__item product-name__item--name"
        title="Produit laitier sans lactose 2 %">
      Produit laitier sans lactose 2 %
    </h1>
    <span class="product-name__item product-name__item--package-size">2 l</span>
  </div>
  <div class="product-details-page-details__content__prices">
    <div class="product-prices product-prices--product-details-page">
      <div aria-label="6,25 $ chacun,  étai 6,49 $"
           class="selling-price-list selling-price-list--sale
             selling-price-list--product-details-page"
           role="group">
        <div class="selling-price-list__item">
          <span class="price selling-price-list__item__price
            selling-price-list__item__price--sale">
            <span class="price__value selling-price-list__item__price
              selling-price-list__item__price--sale__value">
              6,25 $
            </span>
            <span class="price__unit selling-price-list__item__price
              selling-price-list__item__price--sale__unit">
              ch
            </span>
          </span>
        </div>
        <div class="selling-price-list__item">
          <del class="price selling-price-list__item__price
            selling-price-list__item__price--was-price">
            <span class="price__value selling-price-list__item__price
              selling-price-list__item__price--was-price__value">
              6,49 $
            </span>
          </del>
        </div>
      </div>
      <ul class="comparison-price-list comparison-price-list--product-details-page">
        <li class="comparison-price-list__item">
          <span class="price comparison-price-list__item__price">
            <span class="price__value comparison-price-list__item__price__value">
              0,31 $
            </span>
            <span class="price__unit comparison-price-list__item__price__unit">
              / 100ml
            </span>
          </span>
        </li>
      </ul>
    </div>
  </div>
  <button
    data-track-products-array='[{"productSKU":"20077874001_EA",
      "productName":"Produit laitier sans lactose 2 %",
      "productBrand":"Natrel","productPrice":"6.25"}]'>
    Ajouter
  </button>
</div>
"""


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
    assert offer.price == Price(amount="6.25")
    assert offer.package_size == PackageSize(value=2.0, unit="l")


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
