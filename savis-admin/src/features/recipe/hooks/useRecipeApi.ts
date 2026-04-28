import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecipe, deleteRecipe, getRecipes } from "../api/recipeApi";

const RECIPES_QUERY_KEY = ["recipes"];

export const useGetRecipes = () => {
  return useQuery({
    queryKey: RECIPES_QUERY_KEY,
    queryFn: getRecipes,
  });
};

export const usePostRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRecipe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
    },
  });
};
