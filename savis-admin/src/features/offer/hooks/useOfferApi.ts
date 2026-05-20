import { useQuery } from "@tanstack/react-query";
import { getOffers } from "../api/offerApi";

const OFFERS_QUERY_KEY = ["executor-offers"];

export const useGetOffers = (
  page: number,
  size: number,
  sortBy?: string,
  sortDirection?: "asc" | "desc",
) => {
  return useQuery({
    queryKey: [...OFFERS_QUERY_KEY, page, size, sortBy, sortDirection],
    queryFn: () => getOffers({ page, size, sortBy, sortDirection }),
  });
};
