import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { useSalesList } from "@/features/sales/hooks/useSalesList";

const rows = [
  { name: "Émile", status: "OPEN", createdAt: "2026-01-01" },
  { name: "Ada", status: "CLOSED", createdAt: "2026-03-01" },
  { name: "Zoé", status: "OPEN", createdAt: "2026-02-01" },
];

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter initialEntries={["/sales"]}>{children}</MemoryRouter>;
}

describe("useSalesList", () => {
  it("searches without accents, filters, and sorts client-side", () => {
    const { result } = renderHook(
      () =>
        useSalesList(rows, {
          searchableText: (row) => row.name,
          sortValue: (row, column) => row[column as keyof typeof row],
          sortColumns: ["name", "createdAt"],
          defaultSort: "createdAt-desc",
          matchesFilters: (row, params) =>
            !params.get("status") || row.status === params.get("status"),
        }),
      { wrapper },
    );

    expect(result.current.items.map((row) => row.name)).toEqual([
      "Ada",
      "Zoé",
      "Émile",
    ]);

    act(() => result.current.update("status", "OPEN"));
    expect(result.current.items.map((row) => row.name)).toEqual([
      "Zoé",
      "Émile",
    ]);

    act(() => result.current.update("search", "emile"));
    expect(result.current.items.map((row) => row.name)).toEqual(["Émile"]);
    expect(result.current.totalItems).toBe(1);
  });

  it("updates the visible page when navigating or changing page size", () => {
    const manyRows = Array.from({ length: 21 }, (_, index) => ({
      name: `Commande ${index}`,
      status: "OPEN",
      createdAt: String(index).padStart(2, "0"),
    }));
    const { result } = renderHook(
      () =>
        useSalesList(manyRows, {
          searchableText: (row) => row.name,
          sortValue: (row, column) => row[column as keyof typeof row],
          sortColumns: ["name", "createdAt"],
          defaultSort: "createdAt-asc",
        }),
      { wrapper },
    );

    expect(result.current.items).toHaveLength(20);
    expect(result.current.totalPages).toBe(2);
    act(() => result.current.changePage(2));
    expect(result.current.page).toBe(2);
    expect(result.current.items).toHaveLength(1);

    act(() => result.current.update("size", "10"));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.items).toHaveLength(10);
  });
});
