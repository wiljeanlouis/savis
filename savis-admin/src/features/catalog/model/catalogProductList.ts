import { productCategories } from "../types";
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
          product.published === (publication === "PUBLISHED")),
    )
    .sort((a, b) => {
      const sort = params.get("sort") ?? "name-asc";
      const order = sort.endsWith("-desc") ? -1 : 1;
      const column = sort.split("-")[0];
      let comparison: number;
      if (column === "category")
        comparison = (
          productCategories.find((c) => c.value === a.category)?.label ??
          a.category
        ).localeCompare(
          productCategories.find((c) => c.value === b.category)?.label ??
            b.category,
          "fr",
        );
      else if (column === "publication")
        comparison = Number(a.published) - Number(b.published);
      else if (column === "modes")
        comparison = a.purchaseModes.length - b.purchaseModes.length;
      else if (column === "compositions")
        comparison = compositionCount(a) - compositionCount(b);
      else if (column === "price") {
        const first = startingPrice(a),
          second = startingPrice(b);
        // Unknown prices always follow known prices; currencies remain distinct.
        if (!first || !second)
          return first ? -1 : second ? 1 : a.name.localeCompare(b.name, "fr");
        comparison =
          first.currency.localeCompare(second.currency) ||
          first.amount - second.amount;
      } else comparison = a.name.localeCompare(b.name, "fr-CA");
      return (
        order * comparison ||
        a.name.localeCompare(b.name, "fr-CA") ||
        (a.id ?? "").localeCompare(b.id ?? "")
      );
    });
}
