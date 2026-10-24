import {
  normalizeSubcategoryForCategory,
  productSubcategories,
  subcategoriesForCategory,
} from "@/features/catalog/types";
import { describe, expect, it } from "vitest";

describe("product subcategories", () => {
  it("only exposes subcategories belonging to the selected category", () => {
    expect(
      subcategoriesForCategory("DECORATION").map((option) => option.value),
    ).toEqual(["DECORATIVE_ARCH", "CENTERPIECE", "BIRTHDAY", "WEDDING"]);
    expect(subcategoriesForCategory("TASTING")).toEqual([]);
    expect(
      productSubcategories.find(
        (subcategory) => subcategory.value === "DECORATIVE_ARCH",
      )?.label,
    ).toBe("Arche décorative");
  });

  it("keeps a compatible value and clears an incompatible value", () => {
    expect(
      normalizeSubcategoryForCategory("DECORATIVE_ARCH", "DECORATION"),
    ).toBe("DECORATIVE_ARCH");
    expect(
      normalizeSubcategoryForCategory("DECORATIVE_ARCH", "TASTING"),
    ).toBeNull();
    expect(normalizeSubcategoryForCategory(null, "DECORATION")).toBeNull();
  });
});
