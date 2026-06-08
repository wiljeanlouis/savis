import { useBomComponentList } from "@/features/bom-component/hooks/useBomComponentList";
import {
  useDeleteBomComponent,
  useGetBomComponents,
  usePatchBomComponent,
} from "@/features/bom-component/hooks/useBomComponentApi";
import { useCreateBomComponentTask } from "@/features/bom-component/task/hooks/useBomComponentTaskApi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { BrowserRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/bom-component/hooks/useBomComponentApi", () => ({
  useDeleteBomComponent: vi.fn(),
  useGetBomComponents: vi.fn(),
  usePatchBomComponent: vi.fn(),
}));

vi.mock("@/features/bom-component/task/hooks/useBomComponentTaskApi", () => ({
  useCreateBomComponentTask: vi.fn(),
}));

const bomComponentsPage = {
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

const mockUseGetBomComponents = vi.mocked(useGetBomComponents);
const mockUsePatchBomComponent = vi.mocked(usePatchBomComponent);
const mockUseDeleteBomComponent = vi.mocked(useDeleteBomComponent);
const mockUseCreateTask = vi.mocked(useCreateBomComponentTask);
const mutateTaskAsync = vi.fn();
const mutateDelete = vi.fn();

describe("useBomComponentList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/bom-components");

    mockUseGetBomComponents.mockReturnValue({
      data: bomComponentsPage,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useGetBomComponents>);

    mockUsePatchBomComponent.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof usePatchBomComponent>);
    mockUseDeleteBomComponent.mockReturnValue({
      isPending: false,
      mutate: mutateDelete,
    } as unknown as ReturnType<typeof useDeleteBomComponent>);
    mockUseCreateTask.mockReturnValue({
      isPending: false,
      mutateAsync: mutateTaskAsync,
    } as unknown as ReturnType<typeof useCreateBomComponentTask>);
  });

  it("initializes list state from the URL and removes type", async () => {
    window.history.pushState(
      {},
      "",
      "/bom-components?page=3&size=50&sort_by=price&sort_direction=asc&search_term=lait&type=FOOD",
    );

    const { result } = renderHook(() => useBomComponentList(), {
      wrapper: Wrapper,
    });

    expect(result.current.listState).toEqual({
      page: 3,
      pageSize: 50,
      sortBy: "price",
      sortDirection: "asc",
      searchTerm: "lait",
    });
    expect(mockUseGetBomComponents).toHaveBeenLastCalledWith(
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
      "/bom-components?page=-2&size=abc&sort_direction=sideways&type=FOOD",
    );

    const { result } = renderHook(() => useBomComponentList(), {
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
      "/bom-components?page=4&size=30&sort_by=brand&sort_direction=asc",
    );

    const { result } = renderHook(() => useBomComponentList(), {
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
    const { result } = renderHook(() => useBomComponentList(), {
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

  it("creates a GET_OFFERS task for a component name", async () => {
    mutateTaskAsync.mockResolvedValueOnce({});
    const { result } = renderHook(() => useBomComponentList(), {
      wrapper: Wrapper,
    });

    let retrieved = false;
    await act(async () => {
      retrieved = await result.current.handleRetrieve(
        "  boîte à pâtisserie  ",
        "DECORATION",
      );
    });

    expect(retrieved).toBe(true);
    expect(mutateTaskAsync).toHaveBeenCalledWith({
      type: "GET_OFFERS",
      payload: {
        search_term: "boîte à pâtisserie",
        type: "DECORATION",
      },
    });
  });

  it("deletes the selected BOM component", () => {
    const bomComponent = {
      id: "offer-1",
      label: "Farine",
    } as never;
    const { result } = renderHook(() => useBomComponentList(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.handleDelete(bomComponent);
    });

    expect(mutateDelete).toHaveBeenCalledWith(
      "offer-1",
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });
});
