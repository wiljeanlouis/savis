import { api } from "@/shared/api";
import type { RecipeOffer } from "../types";

export const searchAvailableOffers = async (
  componentName: string,
): Promise<RecipeOffer[]> => {
  const { data }: { data: RecipeOffer[] } = await api.get("/supply/offers", {
    params: {
      componentName,
    },
  });

  return data;
};
