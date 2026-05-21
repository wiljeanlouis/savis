import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getIngredientSearchTermFacets,
  getIngredients,
  patchIngredient,
  type PatchIngredientPayload,
} from "../api/ingredientApi";

export const INGREDIENTS_QUERY_KEY = ["executor-offers"];
const INGREDIENT_SEARCH_TERM_FACETS_QUERY_KEY = [
  "executor-offers",
  "search-term-facets",
];

export const useGetIngredients = (
  page: number,
  size: number,
  sortBy?: string,
  sortDirection?: "asc" | "desc",
  searchTerm?: string,
) => {
  return useQuery({
    queryKey: [
      ...INGREDIENTS_QUERY_KEY,
      page,
      size,
      sortBy,
      sortDirection,
      searchTerm,
    ],
    queryFn: () =>
      getIngredients({ page, size, sortBy, sortDirection, searchTerm }),
  });
};

export const useGetIngredientSearchTermFacets = () => {
  return useQuery({
    queryKey: INGREDIENT_SEARCH_TERM_FACETS_QUERY_KEY,
    queryFn: getIngredientSearchTermFacets,
  });
};

export const usePatchIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: PatchIngredientPayload;
    }) => patchIngredient(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: INGREDIENTS_QUERY_KEY });
    },
  });
};
