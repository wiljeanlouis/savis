import type { CatalogProduct, ProductCategory } from "../types";

const KEY = "catalog-product-draft";

const saveDraft = (data: CatalogProduct) => {
  localStorage.setItem(KEY, JSON.stringify(data));
};

const loadDraft = (): CatalogProduct | null => {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    return null;
  }
  const draft = JSON.parse(raw) as CatalogProduct & {
    categoryId?: string;
  };
  return {
    ...draft,
    category: normalizeCategory(draft.category ?? draft.categoryId),
  };
};

const clearDraft = () => {
  localStorage.removeItem(KEY);
};

const hasDraft = () => {
  return loadDraft() !== null;
};

export { saveDraft, loadDraft, clearDraft, hasDraft };

function normalizeCategory(value: string | undefined): ProductCategory {
  return value === "DECORATION" ? "DECORATION" : "TASTING";
}
