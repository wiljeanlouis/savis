import { BomPage } from "@/features/bom/pages/BomPage";
import { usePostBom } from "@/features/bom/hooks/useBomApi";
import type { Bom } from "@/features/bom/types";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/bom/hooks/useBomApi", () => ({
  usePostBom: vi.fn(),
  useSearchAvailableOffers: () => ({ data: [], isLoading: false }),
}));

const bom: Bom = {
  id: "bom-1",
  name: "Composition existante",
  type: "FOOD",
  description: "Description existante",
  imageUrl: "https://example.com/image.jpg",
  instructions: "Mélanger les ingrédients",
  components: [],
  activities: [
    { type: "PREP", minutes: 10, sequence: 1 },
    { type: "COOK", minutes: 20, sequence: 2 },
  ],
  yield: { quantity: 4, unit: "portion" },
};

function renderPage(data: Bom | null = null, hash = "") {
  const path = data ? `/boms/${data.id}` : "/boms/add";
  const router = createMemoryRouter(
    [
      { path: "/boms", element: <h1>Liste des compositions</h1> },
      { path, loader: () => data, element: <BomPage /> },
    ],
    { initialEntries: ["/boms", `${path}${hash}`], initialIndex: 1 },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
  vi.mocked(usePostBom).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(bom),
    isPending: false,
    isSuccess: false,
    isError: false,
  } as unknown as ReturnType<typeof usePostBom>);
});

afterEach(() => vi.unstubAllGlobals());

describe("BomPage", () => {
  it("presents creation as a page with linked sections", async () => {
    renderPage();
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Ajouter une composition",
      }),
    ).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const navigation = screen.getByRole("navigation", {
      name: "Sections de la composition",
    });
    for (const title of [
      "Informations générales",
      "Production et rendement",
      "Intrants",
      "Activités",
    ]) {
      const section = screen.getByRole("region", { name: title });
      expect(
        within(navigation).getByRole("link", { name: title }),
      ).toHaveAttribute("href", `#${section.id}`);
    }
    expect(
      screen.queryByRole("region", { name: "Analyse des coûts" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Ajouter un intrant" }),
    );
    expect(
      screen.getByRole("region", { name: "Intrants" }).querySelectorAll("input")
        .length,
    ).toBeGreaterThan(0);
    await userEvent.click(
      screen.getByRole("button", { name: "Ajouter autre activité" }),
    );
    expect(
      screen
        .getByRole("region", { name: "Activités" })
        .querySelectorAll('input[type="number"]'),
    ).toHaveLength(3);
  });

  it("loads saved fields and submits edits from the page", async () => {
    const router = renderPage(bom);
    const name = await screen.findByRole("textbox", {
      name: "Nom",
    });
    expect(name).toHaveValue(bom.name);
    expect(screen.getByRole("textbox", { name: "Instructions" })).toHaveValue(
      bom.instructions,
    );
    expect(screen.getByRole("spinbutton", { name: "Rendement" })).toHaveValue(
      4,
    );
    expect(
      screen.getByRole("region", { name: "Analyse des coûts" }),
    ).toBeVisible();
    await userEvent.clear(name);
    await userEvent.type(name, "Composition modifiée");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() =>
      expect(usePostBom().mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: bom.id,
          name: "Composition modifiée",
          yield: bom.yield,
        }),
      ),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe("/boms"));
  });

  it("opens the cost section directly from a card link", async () => {
    const scrollIntoView = vi.fn();
    const original = Object.getOwnPropertyDescriptor(
      Element.prototype,
      "scrollIntoView",
    );
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    try {
      renderPage(bom, "#bom-cost");
      await screen.findByRole("region", { name: "Analyse des coûts" });
      await waitFor(() =>
        expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" }),
      );
    } finally {
      if (original)
        Object.defineProperty(Element.prototype, "scrollIntoView", original);
      else Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  it("keeps a new draft when cancelling", async () => {
    const router = renderPage();
    await userEvent.type(
      await screen.findByRole("textbox", { name: "Nom" }),
      "Brouillon conservé",
    );
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(await screen.findByRole("alertdialog")).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: /garder|conserver/i }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe("/boms"));
    expect(JSON.parse(localStorage.getItem("bom-draft")!)).toEqual(
      expect.objectContaining({ name: "Brouillon conservé" }),
    );
  });
});
