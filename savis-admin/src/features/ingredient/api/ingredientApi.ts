import { executorApi } from "@/shared/api";
import type { Ingredient, IngredientsPage, IngredientStatus } from "../types";

interface GetIngredientsParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export const getIngredients = async ({
  page,
  size,
  sortBy,
  sortDirection,
}: GetIngredientsParams): Promise<IngredientsPage> => {
  const { data }: { data: IngredientsPage } = await executorApi.get("/offers", {
    params: {
      page,
      size,
      type: "FOOD",
      sort_by: sortBy,
      sort_direction: sortDirection,
    },
  });
  return data;
};

export interface PatchIngredientPayload {
  status?: IngredientStatus;
  refresh_frequency_hours?: number;
  refresh_now?: boolean;
}

export const patchIngredient = async (
  id: string,
  payload: PatchIngredientPayload,
): Promise<Ingredient> => {
  const { data }: { data: Ingredient } = await executorApi.patch(
    `/offers/${id}`,
    payload,
  );
  return data;
};
