import {
  normalizeSubcategoryForCategory,
  subcategoriesForCategory,
} from "@/features/catalog/types";
import { describe, expect, it } from "vitest";

describe("product subcategories", () => {
  it("only exposes subcategories belonging to the selected category", () => {
    expect(
      subcategoriesForCategory("DECORATION").map((option) => option.value),
    ).toEqual(["BALLOON_ARCH", "CENTERPIECE", "BIRTHDAY", "WEDDING"]);
    expect(subcategoriesForCategory("TASTING")).toEqual([]);
  });

  it("keeps a compatible value and clears an incompatible value", () => {
    expect(normalizeSubcategoryForCategory("BALLOON_ARCH", "DECORATION")).toBe(
      "BALLOON_ARCH",
    );
    expect(
      normalizeSubcategoryForCategory("BALLOON_ARCH", "TASTING"),
    ).toBeNull();
    expect(normalizeSubcategoryForCategory(null, "DECORATION")).toBeNull();
  });
});
