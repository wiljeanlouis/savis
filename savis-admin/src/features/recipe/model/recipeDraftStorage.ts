import type { Recipe } from "../types";

const KEY = "recipe-draft";

const saveDraft = (data: Recipe) => {
  localStorage.setItem(data.id ?? KEY, JSON.stringify(data));
};

const loadDraft = (id?: string): Recipe | null => {
  const raw = localStorage.getItem(id ?? KEY);
  return raw ? (JSON.parse(raw) as Recipe) : null;
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
