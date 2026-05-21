import { useIngredientSearchTermFacets } from "@/features/ingredient/hooks/useIngredientSearchTermFacets";
import { useGetIngredientSearchTermFacets } from "@/features/ingredient/hooks/useIngredientApi";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/ingredient/hooks/useIngredientApi", () => ({
  useGetIngredientSearchTermFacets: vi.fn(),
}));

const facets = [
  { search_term: "lait", count: 12 },
  { search_term: "beurre", count: 8 },
  { search_term: "farine", count: 5 },
];

const mockUseGetIngredientSearchTermFacets = vi.mocked(
  useGetIngredientSearchTermFacets,
);

describe("useIngredientSearchTermFacets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetIngredientSearchTermFacets.mockReturnValue({
      data: facets,
      isError: false,
      error: null,
    } as ReturnType<typeof useGetIngredientSearchTermFacets>);
  });

  it("computes the total count and selected facet", () => {
    const onSearchTermChange = vi.fn();

    const { result } = renderHook(() =>
      useIngredientSearchTermFacets({
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
      useIngredientSearchTermFacets({
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
      useIngredientSearchTermFacets({
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
