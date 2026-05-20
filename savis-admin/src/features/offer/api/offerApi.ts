import { executorApi } from "@/shared/api";
import type { OffersPage } from "../types";

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
