import { api } from "@/shared/api";
import type { BomOffer } from "../types";

export const searchAvailableOffers = async (
  resourceId: string,
): Promise<BomOffer[]> => {
  const { data }: { data: BomOffer[] } = await api.get(
    `/supply/offers/resource/${resourceId}`,
    { params: { availableOnly: true } },
  );

  return data;
};
