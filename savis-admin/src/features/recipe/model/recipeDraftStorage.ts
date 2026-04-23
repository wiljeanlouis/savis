import type { Recipe } from "../types"

const KEY = "recipe-draft"

export const saveDraft = (data: Recipe) => {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export const loadDraft = () => {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : null
}

export const clearDraft = () => {
  localStorage.removeItem(KEY)
}