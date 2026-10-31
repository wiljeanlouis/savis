import { searchCatalogProducts } from "@/features/catalog/api/catalogApi";
import { api } from "@/shared/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api", () => ({
  api: { get: vi.fn() },
}));

describe("catalogApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests a bounded server-side product search", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await searchCatalogProducts("biscuit");

    expect(api.get).toHaveBeenCalledWith("/catalog/products", {
      params: { search: "biscuit", availableOnly: true, limit: 20 },
    });
  });
});
