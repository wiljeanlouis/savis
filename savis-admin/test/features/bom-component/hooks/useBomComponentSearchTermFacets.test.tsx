import { useBomComponentSearchTermFacets } from "@/features/bom-component/hooks/useBomComponentSearchTermFacets";
import { useGetBomComponentSearchTermFacets } from "@/features/bom-component/hooks/useBomComponentApi";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/bom-component/hooks/useBomComponentApi", () => ({
  useGetBomComponentSearchTermFacets: vi.fn(),
}));

const facets = [
  { search_term: "lait", count: 12 },
  { search_term: "beurre", count: 8 },
  { search_term: "farine", count: 5 },
];

const mockUseGetBomComponentSearchTermFacets = vi.mocked(
  useGetBomComponentSearchTermFacets,
);

describe("useBomComponentSearchTermFacets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetBomComponentSearchTermFacets.mockReturnValue({
      data: facets,
      isError: false,
      error: null,
    } as ReturnType<typeof useGetBomComponentSearchTermFacets>);
  });

  it("computes the total count and selected facet", () => {
    const onSearchTermChange = vi.fn();

    const { result } = renderHook(() =>
      useBomComponentSearchTermFacets({
        selectedSearchTerm: "beurre",
        onSearchTermChange,
      }),
    );

    expect(result.current.totalCount).toBe(25);
    expect(result.current.selectedFacet).toEqual({
      search_term: "beurre",
      count: 8,
    });
    expect(result.current.filteredFacets).toEqual(facets);
  });

  it("filters facets locally with the search query", () => {
    const onSearchTermChange = vi.fn();

    const { result } = renderHook(() =>
      useBomComponentSearchTermFacets({
        selectedSearchTerm: undefined,
        onSearchTermChange,
      }),
    );

    act(() => {
      result.current.setSearchQuery("lai");
    });

    expect(result.current.filteredFacets).toEqual([
      { search_term: "lait", count: 12 },
    ]);
  });

  it("exposes the facet change callback", () => {
    const onSearchTermChange = vi.fn();

    const { result } = renderHook(() =>
      useBomComponentSearchTermFacets({
        selectedSearchTerm: undefined,
        onSearchTermChange,
      }),
    );

    act(() => {
      result.current.onSearchTermChange("farine");
    });

    expect(onSearchTermChange).toHaveBeenCalledWith("farine");
  });
});
