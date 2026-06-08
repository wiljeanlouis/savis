import type { Bom } from "../types";

const KEY = "bom-draft";

const saveDraft = (data: Bom) => {
  localStorage.setItem(data.id ?? KEY, JSON.stringify(data));
};

const loadDraft = (id?: string): Bom | null => {
  const raw = localStorage.getItem(id ?? KEY);
  return raw ? (JSON.parse(raw) as Bom) : null;
};

const clearDraft = (id?: string) => {
  localStorage.removeItem(id ?? KEY);
};

const hasDraft = (id?: string) => {
  const draft = loadDraft(id ?? KEY);

  if (draft) return true; // Draft exists

  return false; // No draft found
};

export { saveDraft, loadDraft, clearDraft, hasDraft };
