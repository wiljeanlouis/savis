import { useIngredientList } from "@/features/ingredient/hooks/useIngredientList";
import {
  useGetIngredients,
  usePatchIngredient,
} from "@/features/ingredient/hooks/useIngredientApi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { BrowserRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/ingredient/hooks/useIngredientApi", () => ({
  useGetIngredients: vi.fn(),
  usePatchIngredient: vi.fn(),
}));

const ingredientsPage = {
  items: [],
  page: 1,
  size: 20,
  total_items: 0,
  total_pages: 5,
};

const Wrapper = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

const mockUseGetIngredients = vi.mocked(useGetIngredients);
const mockUsePatchIngredient = vi.mocked(usePatchIngredient);

describe("useIngredientList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/ingredients");

    mockUseGetIngredients.mockReturnValue({
      data: ingredientsPage,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useGetIngredients>);

    mockUsePatchIngredient.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePatchIngredient>);
  });

  it("initializes list state from the URL and removes type", async () => {
    window.history.pushState(
      {},
      "",
      "/ingredients?page=3&size=50&sort_by=price&sort_direction=asc&search_term=lait&type=FOOD",
    );

    const { result } = renderHook(() => useIngredientList(), {
      wrapper: Wrapper,
    });

    expect(result.current.listState).toEqual({
      page: 3,
      pageSize: 50,
      sortBy: "price",
      sortDirection: "asc",
      searchTerm: "lait",
    });
    expect(mockUseGetIngredients).toHaveBeenLastCalledWith(
      3,
      50,
      "price",
      "asc",
      "lait",
    );

    await waitFor(() => {
      expect(window.location.search).not.toContain("type=");
    });
  });

  it("normalizes missing or invalid filters in the URL", async () => {
    window.history.pushState(
      {},
      "",
      "/ingredients?page=-2&size=abc&sort_direction=sideways&type=FOOD",
    );

    const { result } = renderHook(() => useIngredientList(), {
      wrapper: Wrapper,
    });

    expect(result.current.listState).toEqual({
      page: 1,
      pageSize: 20,
      sortBy: "last_retrieved_at",
      sortDirection: "desc",
      searchTerm: undefined,
    });

    await waitFor(() => {
      const searchParams = new URLSearchParams(window.location.search);

      expect(searchParams.get("page")).toBe("1");
      expect(searchParams.get("size")).toBe("20");
      expect(searchParams.get("sort_by")).toBe("last_retrieved_at");
      expect(searchParams.get("sort_direction")).toBe("desc");
      expect(searchParams.has("type")).toBe(false);
    });
  });

  it("writes facet changes to the URL and resets the page to 1", async () => {
    window.history.pushState(
      {},
      "",
      "/ingredients?page=4&size=30&sort_by=brand&sort_direction=asc",
    );

    const { result } = renderHook(() => useIngredientList(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.handleSearchTermChange("beurre");
    });

    await waitFor(() => {
      const searchParams = new URLSearchParams(window.location.search);

      expect(searchParams.get("page")).toBe("1");
      expect(searchParams.get("size")).toBe("30");
      expect(searchParams.get("sort_by")).toBe("brand");
      expect(searchParams.get("sort_direction")).toBe("asc");
      expect(searchParams.get("search_term")).toBe("beurre");
      expect(searchParams.has("type")).toBe(false);
    });
  });

  it("updates sorting, direction, and pagination in the URL", async () => {
    const { result } = renderHook(() => useIngredientList(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.handleSortByChange("label");
    });
    act(() => {
      result.current.toggleSortDirection();
    });
    act(() => {
      result.current.handlePageSizeChange(50);
    });
    act(() => {
      result.current.goToNextPage();
    });

    await waitFor(() => {
      const searchParams = new URLSearchParams(window.location.search);

      expect(searchParams.get("page")).toBe("2");
      expect(searchParams.get("size")).toBe("50");
      expect(searchParams.get("sort_by")).toBe("label");
      expect(searchParams.get("sort_direction")).toBe("asc");
      expect(searchParams.has("type")).toBe(false);
    });
  });
});
