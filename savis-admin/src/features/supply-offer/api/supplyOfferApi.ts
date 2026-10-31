import { api } from "@/shared/api";
import type {
  SupplyOfferCatalogPage,
  SupplyOfferCatalogParams,
} from "../types";

/** Retrieves one server-filtered page of persisted Supply offers. */
export async function getSupplyOffers(
  request: SupplyOfferCatalogParams,
): Promise<SupplyOfferCatalogPage> {
  const search = request.search?.trim();
  const response = await api.get<SupplyOfferCatalogPage>(
    "/supply/offers/catalog",
    {
      params: {
        page: request.page,
        size: request.size,
        status: request.status,
        sort: request.sort,
        ...(search ? { search } : {}),
      },
    },
  );

  return response.data;
}
