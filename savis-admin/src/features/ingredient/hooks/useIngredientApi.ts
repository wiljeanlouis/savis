import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getIngredients,
  patchIngredient,
  type PatchIngredientPayload,
} from "../api/ingredientApi";

export const INGREDIENTS_QUERY_KEY = ["executor-offers"];

export const useGetIngredients = (
  page: number,
  size: number,
  sortBy?: string,
  sortDirection?: "asc" | "desc",
) => {
  return useQuery({
    queryKey: [...INGREDIENTS_QUERY_KEY, page, size, sortBy, sortDirection],
    queryFn: () => getIngredients({ page, size, sortBy, sortDirection }),
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
