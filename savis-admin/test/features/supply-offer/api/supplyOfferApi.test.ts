import { getSupplyOffers } from "@/features/supply-offer/api/supplyOfferApi";
import type { SupplyOfferCatalogPage } from "@/features/supply-offer/types";
import { api } from "@/shared/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api", () => ({
  api: { get: vi.fn() },
}));

const response: SupplyOfferCatalogPage = {
  content: [
    {
      resourceId: null,
      id: "offer-1",
      componentName: "Farine",
      label: null,
      brand: null,
      imageUrl: null,
      url: null,
      provider: { name: "Maxi", identifier: "maxi", site: null },
      price: { amount: 3.75, currency: "CAD" },
      packageSize: null,
      status: "AVAILABLE",
      lastSeen: null,
    },
  ],
  page: 2,
  size: 20,
  totalElements: 45,
  totalPages: 3,
};

describe("supplyOfferApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps the paged contract and sends every server-side parameter", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: response });

    await expect(
      getSupplyOffers({
        page: 2,
        size: 20,
        search: "  farine  ",
        status: "ALL",
        sort: "price,asc",
      }),
    ).resolves.toEqual(response);

    expect(api.get).toHaveBeenCalledWith("/supply/offers/catalog", {
      params: {
        page: 2,
        size: 20,
        search: "farine",
        status: "ALL",
        sort: "price,asc",
      },
    });
    expect(response.content[0].label).toBeNull();
    expect(response.content[0].price?.amount).toBe(3.75);
  });

  it("does not send an empty optional search", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: response });

    await getSupplyOffers({
      page: 0,
      size: 20,
      search: "   ",
      status: "UNAVAILABLE",
      sort: "componentName,desc",
    });

    expect(api.get).toHaveBeenCalledWith("/supply/offers/catalog", {
      params: {
        page: 0,
        size: 20,
        status: "UNAVAILABLE",
        sort: "componentName,desc",
      },
    });
  });
});
