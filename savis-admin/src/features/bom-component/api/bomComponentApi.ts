import { executorApi } from "@/shared/api";
import type {
  BomComponent,
  BomComponentsPage,
  BomComponentStatus,
  SearchTermFacet,
} from "../types";

interface GetBomComponentsParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  searchTerm?: string;
}

export const getBomComponents = async ({
  page,
  size,
  sortBy,
  sortDirection,
  searchTerm,
}: GetBomComponentsParams): Promise<BomComponentsPage> => {
  const { data }: { data: BomComponentsPage } = await executorApi.get(
    "/offers",
    {
      params: {
        page,
        size,
        search_term: searchTerm,
        sort_by: sortBy,
        sort_direction: sortDirection,
      },
    },
  );
  return data;
};

export const getBomComponentSearchTermFacets = async (): Promise<
  SearchTermFacet[]
> => {
  const { data }: { data: SearchTermFacet[] } = await executorApi.get(
    "/offers/facets/search-terms",
  );
  return data;
};

export interface PatchBomComponentPayload {
  status?: BomComponentStatus;
  refresh_frequency_hours?: number;
}

export const patchBomComponent = async (
  id: string,
  payload: PatchBomComponentPayload,
): Promise<BomComponent> => {
  const { data }: { data: BomComponent } = await executorApi.patch(
    `/offers/${id}`,
    payload,
  );
  return data;
};

export const deleteBomComponent = async (id: string): Promise<void> => {
  await executorApi.delete(`/offers/${id}`);
};
