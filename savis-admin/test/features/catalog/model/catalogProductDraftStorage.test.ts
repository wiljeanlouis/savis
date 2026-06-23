import {
  clearDraft,
  hasDraft,
  loadDraft,
  saveDraft,
} from "@/features/catalog/model/catalogProductDraftStorage";
import { emptyCatalogProduct } from "@/features/catalog/types";
import { beforeEach, describe, expect, it } from "vitest";

describe("catalogProductDraftStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads the product draft", () => {
    const product = {
      ...emptyCatalogProduct("category-id"),
      name: "Mini bouchées",
      gallery: ["https://example.com/image.jpg"],
    };

    saveDraft(product);

    expect(loadDraft()).toEqual(product);
    expect(hasDraft()).toBe(true);
  });

  it("clears the product draft", () => {
    saveDraft(emptyCatalogProduct("category-id"));

    clearDraft();

    expect(loadDraft()).toBeNull();
    expect(hasDraft()).toBe(false);
  });
});
