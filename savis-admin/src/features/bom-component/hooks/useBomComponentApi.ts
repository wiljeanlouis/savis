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
) => {
  return useQuery({
    queryKey: [
      ...BOM_COMPONENTS_QUERY_KEY,
      page,
      size,
      sortBy,
      sortDirection,
      searchTerm,
    ],
    queryFn: () =>
      getBomComponents({ page, size, sortBy, sortDirection, searchTerm }),
  });
};

export const useGetBomComponentSearchTermFacets = () => {
  return useQuery({
    queryKey: BOM_COMPONENT_SEARCH_TERM_FACETS_QUERY_KEY,
    queryFn: getBomComponentSearchTermFacets,
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
