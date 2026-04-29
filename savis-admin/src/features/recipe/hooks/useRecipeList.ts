import type { Recipe } from "../types";
import { useDeleteRecipe, useGetRecipes } from "./useRecipeApi";

export const useRecipeList = () => {
  const useQuery = useGetRecipes();
  const useMutation = useDeleteRecipe();

  const deleteRecipe = async (id: string) => {
    await useMutation.mutateAsync(id);
  };

  return {
    recipes: useQuery.data as Recipe[] | undefined,
    isLoading: useQuery.isPending,
    isError: useQuery.isError,
    error: useQuery.error,
    deleteRecipe: deleteRecipe,
  };
};
