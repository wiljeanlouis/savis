import type { Recipe } from "../types";
import { useDeleteRecipe, useGetRecipes } from "./useRecipeApi";

export const useRecipeList = () => {
  const useQuery = useGetRecipes();
  const useMutation = useDeleteRecipe();

  const deleteRecipe = async (id: string) => {
    await useMutation.mutateAsync(id);
  };

  return {
    recipes: useQuery.data! as Recipe[],
    isLoading: useQuery.isPending,
    isError: useQuery.isError,
    deleteRecipe: deleteRecipe,
  };
};
