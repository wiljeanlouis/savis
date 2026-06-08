import { api } from "@/shared/api";
import type { BomOffer } from "../types";

export const searchAvailableOffers = async (
  componentName: string,
): Promise<BomOffer[]> => {
  const { data }: { data: BomOffer[] } = await api.get("/supply/offers", {
    params: {
      componentName,
    },
  });

  return data;
};
