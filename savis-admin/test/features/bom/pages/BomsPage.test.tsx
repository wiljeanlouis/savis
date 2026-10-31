import { BomsPage } from "@/features/bom/pages/BomsPage";
import { api } from "@/shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { bom, missingCosting } from "../fixtures/costing";

beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
});

afterEach(() => vi.restoreAllMocks());
function setup(entry = "/boms", incomplete = false, activityMinutes = 40) {
  const other = {
    ...bom,
    id: "bom-2",
    name: "Structure de 3 arches",
    imageUrl: "",
    type: "MATERIAL",
    components: [],
    activities: [],
    yield: { quantity: 3, unit: "piece" },
    costing: null,
  };
  const get = vi.spyOn(api, "get").mockImplementation(async (url) => {
    if (url === "/boms") return { data: [{ ...bom, costing: null }, other] };
    if (url === `/boms/${bom.id}`)
      return {
        data: {
          ...bom,
          components: [
            {
              resourceId: "r1",
              componentName: "Farine",
              quantity: 100,
              unit: "g",
            },
          ],
          activities: [{ type: "PREP", minutes: activityMinutes, sequence: 1 }],
          costing: incomplete ? missingCosting : bom.costing,
        },
      };
    if (url === "/boms/bom-2") return { data: other };
    throw Error(String(url));
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [{ path: "/boms", element: <BomsPage /> }],
    { initialEntries: [entry] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { get, router, client };
}
it("loads the full table without requesting individual costs", async () => {
  const { get } = setup();
  expect(
    await screen.findByRole("table", { name: "Liste des compositions" }),
  ).toBeVisible();
  expect(screen.getAllByRole("columnheader")).toHaveLength(6);
  expect(screen.getByRole("columnheader", { name: "Rendement" })).toBeVisible();
  expect(
    screen.queryByRole("columnheader", { name: "Unité de rendement" }),
  ).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(get.mock.calls.map(([url]) => url)).toEqual(["/boms"]);
});
it("opens selected valuation with complete cost, production and existing actions", async () => {
  const { get } = setup();
  await userEvent.click(
    await screen.findByRole("button", { name: "Détails de Pâte à pain" }),
  );
  expect(await screen.findByText("Coût complet")).toBeVisible();
  expect(screen.getByText("Farine")).toBeVisible();
  expect(screen.getByText("40 min")).toBeVisible();
  expect(screen.getByText(/Rendement : 4 portion/)).toBeVisible();
  expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
    "href",
    "/boms/bom-1",
  );
  expect(
    screen.getByRole("link", { name: "Analyser les coûts" }),
  ).toHaveAttribute("href", "/boms/bom-1#bom-cost");
  expect(
    screen.getByRole("region", { name: "Informations de la composition" }),
  ).not.toContainElement(screen.getByRole("link", { name: "Modifier" }));
  expect(get.mock.calls.map(([url]) => url)).toEqual(["/boms", "/boms/bom-1"]);
});
it("restores incomplete valuation and blocking diagnostics without full or unit totals", async () => {
  setup("/boms?selected=bom-1", true);
  expect(await screen.findByText("Coût incomplet")).toBeVisible();
  expect(screen.getByText("Sous-total connu")).toBeVisible();
  expect(screen.getByText("1 diagnostic bloquant")).toBeVisible();
  expect(screen.queryByText("Coût total")).toBeNull();
  expect(screen.queryByText("Coût par unité produite")).toBeNull();
});
it("closes with Escape and restores focus while preserving filters", async () => {
  const { router } = setup("/boms?type=MATERIAL&custom=keep");
  const trigger = await screen.findByRole("button", {
    name: "Détails de Structure de 3 arches",
  });
  trigger.focus();
  await userEvent.keyboard("{Enter}");
  expect(await screen.findByText("Coût non évalué")).toBeVisible();
  expect(router.state.location.search).toContain("selected=bom-2");
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(router.state.location.search).toBe("?type=MATERIAL&custom=keep");
  expect(trigger).toHaveFocus();
});
it("supports browser back and forward with URL as the sole drawer state", async () => {
  const { router } = setup();
  await userEvent.click(
    await screen.findByRole("button", { name: "Détails de Pâte à pain" }),
  );
  await screen.findByText("Coût complet");
  await router.navigate(-1);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await router.navigate(1);
  expect(await screen.findByText("Coût complet")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
  expect(router.state.location.search).not.toContain("selected=");
});
it("searches without accents, filters and sorts the full list", async () => {
  const { router, get } = setup();
  await screen.findByRole("table");
  await userEvent.click(screen.getByRole("button", { name: "Composition" }));
  expect(screen.getAllByRole("row")[1]).toHaveTextContent(
    "Structure de 3 arches",
  );
  expect(router.state.location.search).toContain("sort=name-desc");
  fireEvent.change(
    screen.getByPlaceholderText("Rechercher par nom ou description"),
    {
      target: { value: "pate" },
    },
  );
  expect(screen.getAllByRole("row")).toHaveLength(2);
  fireEvent.change(
    screen.getByPlaceholderText("Rechercher par nom ou description"),
    {
      target: { value: "introuvable" },
    },
  );
  expect(
    screen.getByText(
      "Aucune composition ne correspond aux filtres sélectionnés.",
    ),
  ).toBeVisible();
  expect(get).toHaveBeenCalledTimes(1);
});
it("clears invalid selections without requesting a fallback valuation", async () => {
  const { router, get } = setup("/boms?type=FOOD&selected=bom-2&custom=keep");
  await screen.findByRole("table");
  await waitFor(() =>
    expect(router.state.location.search).not.toContain("selected="),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(get).toHaveBeenCalledTimes(1);
});
it("retains zero-duration activities and missing-cost distinctions", async () => {
  setup("/boms?selected=bom-1", false, 0);
  expect(await screen.findByText("0 min")).toBeVisible();
});
it("retains empty production and missing valuation", async () => {
  setup("/boms?selected=bom-2");
  expect(await screen.findByText("Coût non évalué")).toBeVisible();
  expect(screen.getByText("Aucun composant")).toBeVisible();
  expect(screen.getByText("Aucune activité")).toBeVisible();
});
it("sorts before pagination and retains the original filters on close", async () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({
    ...bom,
    id: `bom-${i}`,
    name: `Composition ${String(i).padStart(2, "0")}`,
    components: [],
    activities: [],
    costing: null,
  }));
  vi.spyOn(api, "get").mockImplementation(async (url) => ({
    data: url === "/boms" ? rows : rows.find((b) => url === `/boms/${b.id}`),
  }));
  const router = createMemoryRouter(
    [{ path: "/boms", element: <BomsPage /> }],
    { initialEntries: ["/boms?size=10&custom=keep"] },
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByRole("table");
  await userEvent.click(screen.getByRole("button", { name: "Composition" }));
  expect(screen.getAllByRole("row")[1]).toHaveTextContent("Composition 11");
  await userEvent.click(screen.getByRole("button", { name: "Suivant" }));
  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(screen.getAllByRole("row")[1]).toHaveTextContent("Composition 01");
  await userEvent.click(
    screen.getByRole("button", { name: "Détails de Composition 01" }),
  );
  await screen.findByText("Coût non évalué");
  await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
  expect(screen.getByText("Page 2 sur 2")).toBeVisible();
  expect(router.state.location.search).toContain("custom=keep");
  expect(router.state.location.search).toContain("sort=name-desc");
});

it("keeps the useful yield-unit filter and combines quantity and unit in Rendement", async () => {
  const { router } = setup();
  await screen.findByRole("table", { name: "Liste des compositions" });

  await userEvent.click(screen.getByRole("button", { name: "Filtres" }));
  await userEvent.click(
    screen.getByRole("combobox", { name: "Unité de rendement" }),
  );
  await userEvent.click(screen.getByRole("option", { name: "piece" }));

  expect(router.state.location.search).toContain("unit=piece");
  expect(screen.getAllByRole("row")).toHaveLength(2);
  expect(screen.getAllByRole("row")[1]).toHaveTextContent(
    "Structure de 3 arches",
  );
  expect(screen.getAllByRole("row")[1]).toHaveTextContent("3 piece");
});

it("removes the retired component filter from old links and keeps useful filters in a popover", async () => {
  const { router } = setup(
    "/boms?components=WITH&unit=unknown&sort=name-desc&size=20&custom=keep",
  );
  await screen.findByRole("table");
  expect(screen.getAllByRole("row")).toHaveLength(3);
  await waitFor(() =>
    expect(router.state.location.search).not.toContain("components="),
  );
  expect(router.state.location.search).not.toContain("unit=");
  expect(screen.queryByRole("combobox", { name: "Activité" })).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Filtres" }));
  expect(screen.getByRole("combobox", { name: "Activité" })).toBeVisible();
  expect(
    screen.getByRole("combobox", { name: "Unité de rendement" }),
  ).toBeVisible();
  expect(screen.queryByRole("combobox", { name: "Composants" })).toBeNull();
  expect(screen.queryByRole("button", { name: /Plus de filtres/ })).toBeNull();
  await userEvent.click(
    screen.getByRole("combobox", { name: "Type de composition" }),
  );
  await userEvent.click(screen.getByRole("option", { name: "Matériel" }));
  expect(screen.getAllByRole("row")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Filtres · 1" })).toBeVisible();
  await userEvent.click(screen.getByRole("combobox", { name: "Activité" }));
  await userEvent.click(screen.getByRole("option", { name: "Sans activité" }));
  expect(screen.getByRole("button", { name: "Filtres · 2" })).toBeVisible();
  expect(router.state.location.search).toContain("activity=NONE");
  await userEvent.click(
    screen.getByRole("button", { name: "Effacer les filtres" }),
  );
  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(router.state.location.search).toBe(
    "?sort=name-desc&size=20&custom=keep",
  );
  const search = screen.getByRole("textbox", {
    name: "Rechercher par nom ou description",
  });
  await userEvent.click(screen.getByRole("button", { name: "Rechercher" }));
  expect(search).toHaveFocus();
});
