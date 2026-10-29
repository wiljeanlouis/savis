import { BomsPage } from "@/features/bom/pages/BomsPage";
import { BomPage } from "@/features/bom/pages/BomPage";
import { getBom } from "@/features/bom/api/bomApi";
import { api } from "@/shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bom, missingCosting } from "../fixtures/costing";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("BomsPage data loading", () => {
  it("requests only the unpriced list, loads analysis on detail, and reuses the list on return", async () => {
    const unpriced = { ...bom, price: null, costing: null };
    const get = vi.spyOn(api, "get").mockImplementation(async (url) => {
      if (url === "/boms")
        return {
          data: [unpriced, { ...unpriced, id: "bom-2", name: "Décoration" }],
        };
      if (url === `/boms/${bom.id}`)
        return { data: { ...bom, costing: missingCosting } };
      throw new Error(`Unexpected request: ${url}`);
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const router = createMemoryRouter(
      [
        { path: "/boms", element: <BomsPage /> },
        {
          path: "/boms/:id",
          loader: ({ params }) => getBom(params.id!),
          element: <BomPage />,
        },
      ],
      { initialEntries: ["/boms"] },
    );
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(bom.name)).toBeVisible();
    expect(
      screen.queryByText(/coût|sous-total|analyse/i),
    ).not.toBeInTheDocument();
    expect(get.mock.calls.map(([url]) => url)).toEqual(["/boms"]);
    await userEvent.type(
      screen.getByPlaceholderText("Rechercher dans les compositions"),
      "pain",
    );
    expect(screen.queryByText("Décoration")).not.toBeInTheDocument();
    expect(get).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("link", { name: "Modifier" }));
    expect(
      await screen.findByRole("region", { name: "Analyse des coûts" }),
    ).toBeVisible();
    expect(screen.getByText("Coût incomplet")).toBeVisible();
    expect(screen.getByText("Taux horaire absent")).toBeVisible();
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      "/boms",
      `/boms/${bom.id}`,
    ]);
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    await screen.findByRole("heading", { name: "Compositions" });
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(screen.getByText("Décoration")).toBeVisible();
    expect(get).toHaveBeenCalledTimes(2);
    queryClient.clear();
  });
});
