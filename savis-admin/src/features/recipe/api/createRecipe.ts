import { api } from "../../../shared/api"
import {type Recipe } from "../types"

export const createRecipe = async (recipe: Recipe) => {
  const { data } = await api.post("/recipes", recipe)
  return data
}