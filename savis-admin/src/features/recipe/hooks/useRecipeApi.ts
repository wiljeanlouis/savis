import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecipe, deleteRecipe, getRecipes } from "../api/recipeApi";
import { searchAvailableOffers } from "../api/supplyOfferApi";

const RECIPES_QUERY_KEY = ["recipes"];
const AVAILABLE_OFFERS_QUERY_KEY = ["available-offers"];

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

export const useSearchAvailableOffers = (componentName: string) => {
  const trimmedComponentName = componentName.trim();

  return useQuery({
    queryKey: [...AVAILABLE_OFFERS_QUERY_KEY, trimmedComponentName],
    queryFn: () => searchAvailableOffers(trimmedComponentName),
    enabled: trimmedComponentName.length >= 2,
  });
};
