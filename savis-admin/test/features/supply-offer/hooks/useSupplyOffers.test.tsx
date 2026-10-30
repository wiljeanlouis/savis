import { MemoryRouter, useLocation } from "react-router";
import {
  SUPPLY_OFFERS_QUERY_KEY,
  useSupplyOffers,
} from "@/features/supply-offer/hooks/useSupplyOffers";
import { getSupplyOffers } from "@/features/supply-offer/api/supplyOfferApi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/supply-offer/api/supplyOfferApi", () => ({
  getSupplyOffers: vi.fn(),
}));

const emptyPage = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
};

describe("useSupplyOffers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupplyOffers).mockResolvedValue(emptyPage);
  });

  it("uses the API defaults and includes all filters in its query key", async () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useSupplyOffers(), {
      wrapper: queryWrapper(queryClient),
    });

    await waitFor(() =>
      expect(getSupplyOffers).toHaveBeenCalledWith({
        page: 0,
        size: 20,
        search: "",
        status: "AVAILABLE",
        sort: "lastSeen,desc",
      }),
    );

    expect(
      queryClient.getQueryState([
        ...SUPPLY_OFFERS_QUERY_KEY,
        {
          page: 0,
          size: 20,
          search: "",
          status: "AVAILABLE",
          sort: "lastSeen,desc",
        },
      ]),
    ).toBeDefined();
    expect(result.current.page).toBe(0);
  });

  it("resets pagination for status, sort and search changes", async () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useSupplyOffers(), {
      wrapper: queryWrapper(queryClient),
    });
    await waitFor(() => expect(getSupplyOffers).toHaveBeenCalled());

    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);

    act(() => result.current.setStatus("UNAVAILABLE"));
    expect(result.current.page).toBe(0);
    await waitFor(() =>
      expect(getSupplyOffers).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 0, status: "UNAVAILABLE" }),
      ),
    );

    act(() => result.current.setPage(2));
    act(() => result.current.setSort("price,desc"));
    expect(result.current.page).toBe(0);
    await waitFor(() =>
      expect(getSupplyOffers).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 0, sort: "price,desc" }),
      ),
    );

    act(() => result.current.setPage(1));
    act(() => result.current.setSearch("farine"));
    expect(result.current.page).toBe(0);
    await waitFor(
      () =>
        expect(getSupplyOffers).toHaveBeenLastCalledWith(
          expect.objectContaining({ page: 0, search: "farine" }),
        ),
      { timeout: 1_000 },
    );

    act(() => result.current.setPage(4));
    act(() => result.current.setPageSize(50));
    expect(result.current.page).toBe(0);
    expect(result.current.pageSize).toBe(50);
    await waitFor(() =>
      expect(getSupplyOffers).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 0, size: 50 }),
      ),
    );
  });
  it("restores sort from URL and keeps search, size and unrelated context when sorting or clearing filters", async () => {
    const client = createQueryClient();
    const { result } = renderHook(
      () => ({ list: useSupplyOffers(), location: useLocation() }),
      {
        wrapper: ({ children }) => (
          <MemoryRouter
            initialEntries={[
              "/supply/offers?search=farine&status=UNAVAILABLE&sort=componentName,desc&page=3&size=50&custom=keep",
            ]}
          >
            <QueryClientProvider client={client}>
              {children}
            </QueryClientProvider>
          </MemoryRouter>
        ),
      },
    );
    await waitFor(() =>
      expect(getSupplyOffers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 3,
          search: "farine",
          status: "UNAVAILABLE",
          sort: "componentName,desc",
          size: 50,
        }),
      ),
    );
    act(() => result.current.list.setSort("price,asc"));
    await waitFor(() =>
      expect(getSupplyOffers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 0,
          search: "farine",
          status: "UNAVAILABLE",
          sort: "price,asc",
          size: 50,
        }),
      ),
    );
    act(() => result.current.list.setStatus("ALL"));
    await waitFor(() =>
      expect(getSupplyOffers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 0,
          search: "farine",
          status: "ALL",
          sort: "price,asc",
          size: 50,
        }),
      ),
    );
    expect(result.current.location.search).toContain("custom=keep");
  });
});

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function queryWrapper(client: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </MemoryRouter>
    );
  };
}
