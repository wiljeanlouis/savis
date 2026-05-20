import { executorApi } from "@/shared/api";
import type { Offer, OffersPage, OfferStatus } from "../types";

interface GetOffersParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export const getOffers = async ({
  page,
  size,
  sortBy,
  sortDirection,
}: GetOffersParams): Promise<OffersPage> => {
  const { data }: { data: OffersPage } = await executorApi.get("/offers", {
    params: { page, size, sort_by: sortBy, sort_direction: sortDirection },
  });
  return data;
};

export interface PatchOfferPayload {
  status?: OfferStatus;
  refresh_frequency_hours?: number;
  refresh_now?: boolean;
}

export const patchOffer = async (
  id: string,
  payload: PatchOfferPayload,
): Promise<Offer> => {
  const { data }: { data: Offer } = await executorApi.patch(
    `/offers/${id}`,
    payload,
  );
  return data;
};
