import { describe, expect, it } from "vitest";
import {
  emptyCatalogProduct,
  emptyPurchaseMode,
} from "@/features/catalog/types";
import { filterCatalogProducts } from "@/features/catalog/model/catalogProductList";
const product = (id: string, amount: number | null, currency = "CAD") => ({
  ...emptyCatalogProduct(),
  id,
  name: id,
  purchaseModes:
    amount === null
      ? []
      : [
          {
            ...emptyPurchaseMode(),
            active: true,
            price: { amount, currency },
          },
        ],
});
describe("catalog table sorting", () => {
  it("keeps unknown prices last in both directions and preserves known zero", () => {
    const products = [
      product("Missing", null),
      product("Zero", 0),
      product("Priced", 4),
    ];
    expect(
      filterCatalogProducts(
        products,
        new URLSearchParams("sort=price-asc"),
      ).map((p) => p.id),
    ).toEqual(["Zero", "Priced", "Missing"]);
    expect(
      filterCatalogProducts(
        products,
        new URLSearchParams("sort=price-desc"),
      ).map((p) => p.id),
    ).toEqual(["Priced", "Zero", "Missing"]);
  });
  it("sorts modes and composition counts without mutating source data", () => {
    const first = product("A", 4),
      second = product("B", 6);
    second.purchaseModes.push({ ...emptyPurchaseMode(), active: false });
    second.productBoms = [
      { id: "1", bomId: "bom", quantity: 1, displayOrder: 0 },
      { id: "2", bomId: "bom", quantity: 2, displayOrder: 1 },
    ];
    const products = [first, second];
    for (const sort of ["modes-desc", "compositions-desc"])
      expect(
        filterCatalogProducts(products, new URLSearchParams({ sort })).map(
          (p) => p.id,
        ),
      ).toEqual(["B", "A"]);
    expect(products[0]).toBe(first);
  });
});
