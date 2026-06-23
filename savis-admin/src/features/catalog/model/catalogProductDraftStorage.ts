import type { CatalogProduct } from "../types";

const KEY = "catalog-product-draft";

const saveDraft = (data: CatalogProduct) => {
  localStorage.setItem(KEY, JSON.stringify(data));
};

const loadDraft = (): CatalogProduct | null => {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as CatalogProduct) : null;
};

const clearDraft = () => {
  localStorage.removeItem(KEY);
};

const hasDraft = () => {
  return loadDraft() !== null;
};

export { saveDraft, loadDraft, clearDraft, hasDraft };
