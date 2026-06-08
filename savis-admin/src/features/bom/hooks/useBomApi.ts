import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBom, deleteBom, getBoms } from "../api/bomApi";
import { searchAvailableOffers } from "../api/supplyOfferApi";

const BOMS_QUERY_KEY = ["boms"];
const AVAILABLE_OFFERS_QUERY_KEY = ["available-offers"];

export const useGetBoms = () => {
  return useQuery({
    queryKey: BOMS_QUERY_KEY,
    queryFn: getBoms,
  });
};

export const usePostBom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBom,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BOMS_QUERY_KEY });
    },
  });
};

export const useDeleteBom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBom,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BOMS_QUERY_KEY });
    },
  });
};

export const useSearchAvailableOffers = (componentName: string) => {
  const trimmedComponentName = componentName.trim();

  return useQuery({
    queryKey: [...AVAILABLE_OFFERS_QUERY_KEY, trimmedComponentName],
    queryFn: () => searchAvailableOffers(trimmedComponentName),
    enabled: trimmedComponentName.length >= 2,
  });
};
