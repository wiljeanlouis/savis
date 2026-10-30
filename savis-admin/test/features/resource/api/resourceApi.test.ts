import { beforeEach, expect, it, vi } from "vitest";
import { api } from "@/shared/api";
import { listResources } from "@/features/resource/api/resourceApi";
vi.mock("@/shared/api", () => ({ api: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it("passes category and ordering to the server together with pagination and status", async () => {
  const page = {
    content: [],
    totalElements: 0,
    page: 2,
    size: 10,
    totalPages: 0,
  };
  vi.mocked(api.get).mockResolvedValue({ data: page });
  expect(
    await listResources(
      "farine",
      2,
      "ACTIVE",
      10,
      "INGREDIENT",
      "referenceUnit,desc",
    ),
  ).toEqual(page);
  expect(api.get).toHaveBeenCalledExactlyOnceWith("/resources", {
    params: {
      search: "farine",
      page: 2,
      size: 10,
      status: "ACTIVE",
      category: "INGREDIENT",
      sort: "referenceUnit,desc",
    },
  });
});
it("retains name ascending defaults for existing resource selectors", async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { content: [] } });
  await listResources("farine", 0, "ACTIVE");
  expect(api.get).toHaveBeenCalledWith("/resources", {
    params: {
      search: "farine",
      page: 0,
      size: 20,
      status: "ACTIVE",
      category: undefined,
      sort: "name,asc",
    },
  });
});
