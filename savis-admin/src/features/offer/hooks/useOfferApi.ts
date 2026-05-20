import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOffers, patchOffer, type PatchOfferPayload } from "../api/offerApi";

export const OFFERS_QUERY_KEY = ["executor-offers"];

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

export const usePatchOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatchOfferPayload }) =>
      patchOffer(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY });
    },
  });
};
