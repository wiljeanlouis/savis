import type { CatalogProduct, Money } from "../types";

export function startingPrice(product: CatalogProduct): Money | null {
  const prices = product.purchaseModes
    .filter((mode) => mode.active)
    .map((mode) => mode.price)
    .filter((price): price is Money => price != null);
  if (
    !prices.length ||
    prices.some((price) => price.currency !== prices[0].currency)
  )
    return null;
  return prices.reduce((lowest, price) =>
    price.amount < lowest.amount ? price : lowest,
  );
}
export function productMoney(price: Money | null | undefined) {
  return price
    ? new Intl.NumberFormat("fr-CA", {
        style: "currency",
        currency: price.currency,
      }).format(price.amount)
    : "Prix non renseigné";
}
export function compositionCount(product: CatalogProduct) {
  return new Set(
    [
      ...product.productBoms.map((bom) => bom.bomId),
      ...(product.choiceGroup?.options.map((option) => option.bomId) ?? []),
      ...product.ingredientOptions.map((option) => option.bomId),
    ].filter(Boolean),
  ).size;
}
const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr-CA");
export function filterCatalogProducts(
  products: CatalogProduct[],
  params: URLSearchParams,
) {
  const search = normalized(params.get("search") ?? "").trim();
  const category = params.get("category");
  const publication = params.get("publication");
  const availability = params.get("availability");
  return products
    .filter(
      (product) =>
        (!search ||
          normalized(
            `${product.name} ${product.code} ${product.description}`,
          ).includes(search)) &&
        (!category || category === "ALL" || product.category === category) &&
        (!publication ||
          publication === "ALL" ||
          product.published === (publication === "PUBLISHED")) &&
        (!availability ||
          availability === "ALL" ||
          product.available === (availability === "AVAILABLE")),
    )
    .sort((a, b) => {
      const order = params.get("sort") === "name-desc" ? -1 : 1;
      return (
        order *
        (a.name.localeCompare(b.name, "fr-CA") ||
          a.code.localeCompare(b.code) ||
          (a.id ?? "").localeCompare(b.id ?? ""))
      );
    });
}
