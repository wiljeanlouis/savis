import { executorApi } from "@/shared/api";
import type {
  Ingredient,
  IngredientsPage,
  IngredientStatus,
  SearchTermFacet,
} from "../types";

interface GetIngredientsParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  searchTerm?: string;
}

export const getIngredients = async ({
  page,
  size,
  sortBy,
  sortDirection,
  searchTerm,
}: GetIngredientsParams): Promise<IngredientsPage> => {
  const { data }: { data: IngredientsPage } = await executorApi.get("/offers", {
    params: {
      page,
      size,
      type: "FOOD",
      search_term: searchTerm,
      sort_by: sortBy,
      sort_direction: sortDirection,
    },
  });
  return data;
};

export const getIngredientSearchTermFacets = async (): Promise<
  SearchTermFacet[]
> => {
  const { data }: { data: SearchTermFacet[] } = await executorApi.get(
    "/offers/facets/search-terms",
    {
      params: {
        type: "FOOD",
      },
    },
  );
  return data;
};

export interface PatchIngredientPayload {
  status?: IngredientStatus;
  refresh_frequency_hours?: number;
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
