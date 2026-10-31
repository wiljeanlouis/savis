import type { BomComponentStatus } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteBomComponent,
  getBomComponentSearchTermFacets,
  getBomComponents,
  patchBomComponent,
  type PatchBomComponentPayload,
} from "../api/bomComponentApi";

export const BOM_COMPONENTS_QUERY_KEY = ["executor-offers"];
const BOM_COMPONENT_SEARCH_TERM_FACETS_QUERY_KEY = [
  "executor-offers",
  "search-term-facets",
];

export const useGetBomComponents = (
  page: number,
  size: number,
  sortBy?: string,
  sortDirection?: "asc" | "desc",
  searchTerm?: string,
  status?: BomComponentStatus,
) => {
  return useQuery({
    queryKey: [
      ...BOM_COMPONENTS_QUERY_KEY,
      page,
      size,
      sortBy,
      sortDirection,
      searchTerm,
      status,
    ],
    queryFn: () =>
      getBomComponents({
        page,
        size,
        sortBy,
        sortDirection,
        searchTerm,
        status,
      }),
  });
};

export const useGetBomComponentSearchTermFacets = (
  status?: BomComponentStatus,
) => {
  return useQuery({
    queryKey: [...BOM_COMPONENT_SEARCH_TERM_FACETS_QUERY_KEY, status],
    queryFn: () => getBomComponentSearchTermFacets(status),
  });
};

export const usePatchBomComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: PatchBomComponentPayload;
    }) => patchBomComponent(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: BOM_COMPONENTS_QUERY_KEY,
      });
    },
  });
};

export const useDeleteBomComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBomComponent,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: BOM_COMPONENTS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: BOM_COMPONENT_SEARCH_TERM_FACETS_QUERY_KEY,
        }),
      ]);
    },
  });
};
