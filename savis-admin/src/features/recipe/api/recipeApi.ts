import { api } from "../../../shared/api";
import { type Recipe } from "../types";

export const createRecipe = async (recipe: Recipe) => {
  return await api.post("/recipes", recipe);
};

export const getRecipe = async (id: string): Promise<Recipe> => {
  const { data }: { data: Recipe } = await api.get(`/recipes/${id}`);
  return data;
};

export const deleteRecipe = async (id: string) => {
  return api.delete(`/recipes/${id}`);
};

export const getRecipes = async (): Promise<Recipe[]> => {
  const { data }: { data: Recipe[] } = await api.get("/recipes");
  return data;
};
