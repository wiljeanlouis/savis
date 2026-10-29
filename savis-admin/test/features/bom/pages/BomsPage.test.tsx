import { BomsPage } from "@/features/bom/pages/BomsPage";
import { api } from "@/shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
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
function setup(entry = "/boms", incomplete = false) {
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
          activities: [{ type: "PREP", minutes: 40, sequence: 1 }],
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
it("loads only selected valuation, shows saved production and complete cost, and preserves navigation actions", async () => {
  const { get } = setup();
  expect(await screen.findByText("Coût complet")).toBeVisible();
  expect(screen.getByText("Farine")).toBeVisible();
  const panel = screen.getByLabelText("Détail de la composition");
  const content = screen.getByRole("region", {
    name: "Informations de la composition",
  });
  expect(panel).toHaveClass(
    "overflow-hidden",
    "max-h-[var(--bom-detail-height,calc(100dvh-2rem))]",
  );
  expect(panel.style.getPropertyValue("--bom-detail-height")).toMatch(/px$/);
  expect(content).toHaveClass("min-h-0", "flex-1", "overflow-y-auto");
  expect(content).not.toContainElement(
    screen.getByRole("link", { name: "Modifier" }),
  );
  expect(screen.getByText("Préparation")).toBeVisible();
  expect(screen.getByText("40 min")).toBeVisible();
  expect(screen.getByText(/Rendement : 4 portion/)).toBeVisible();
  expect(screen.getByText("Coût total")).toBeVisible();
  expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
    "href",
    "/boms/bom-1",
  );
  expect(
    screen.getByRole("link", { name: "Analyser les coûts" }),
  ).toHaveAttribute("href", "/boms/bom-1#bom-cost");
  await userEvent.click(screen.getByRole("button", { name: "Actions" }));
  expect(screen.getByRole("menuitem", { name: "Cloner" })).toBeVisible();
  expect(screen.getByRole("menuitem", { name: "Supprimer" })).toBeVisible();
  expect(get.mock.calls.map(([url]) => url)).toEqual(["/boms", "/boms/bom-1"]);
});
it("selects via URL, preserves unrelated params, returns to list and reuses valuation cache", async () => {
  const { get, router } = setup("/boms?custom=keep");
  await screen.findByText("Coût complet");
  const list = screen.getByLabelText("Liste des compositions");
  await userEvent.click(
    within(list).getByRole("button", { name: /Structure de 3 arches/ }),
  );
  expect(await screen.findByText("Aucun composant")).toBeVisible();
  expect(screen.getByText("Aucune activité")).toBeVisible();
  expect(screen.getByText("Coût non évalué")).toBeVisible();
  expect(router.state.location.search).toContain("selected=bom-2");
  expect(router.state.location.search).toContain("custom=keep");
  expect(
    screen.getByLabelText("Détail de la composition").parentElement,
  ).toHaveClass("fixed");
  await userEvent.click(
    screen.getByRole("button", { name: "Retour à la liste" }),
  );
  expect(router.state.location.search).toContain("selected=bom-2");
  expect(
    screen.getByLabelText("Détail de la composition").parentElement,
  ).toHaveClass("hidden");
  await userEvent.click(
    within(list).getByRole("button", { name: /Pâte à pain/ }),
  );
  await screen.findByText("Coût complet");
  expect(get).toHaveBeenCalledTimes(3);
});
it("searches without accents using URL state and handles empty search results", async () => {
  const { router } = setup();
  const user = userEvent.setup();
  await screen.findByText("Coût complet");
  const search = screen.getByPlaceholderText(
    "Rechercher dans les compositions",
  );
  await user.click(search);
  await user.paste("pate");
  expect(
    screen.queryByRole("button", { name: /Structure de 3 arches/ }),
  ).not.toBeInTheDocument();
  await waitFor(() =>
    expect(router.state.location.search).toContain("search=pate"),
  );
  await user.paste(" introuvable");
  expect(
    await screen.findByText(
      "Aucune composition ne correspond aux filtres sélectionnés.",
    ),
  ).toBeVisible();
});
it("shows incomplete known subtotals and blocking diagnostics without a full or unit cost", async () => {
  setup("/boms?selected=bom-1", true);
  expect(await screen.findByText("Coût incomplet")).toBeVisible();
  expect(screen.getByText("Sous-total connu")).toBeVisible();
  expect(screen.getByText("1 diagnostic bloquant")).toBeVisible();
  expect(screen.getByText(/Bloquant · Taux horaire absent/)).toBeVisible();
  expect(screen.queryByText("Coût total")).not.toBeInTheDocument();
  expect(screen.queryByText("Coût par unité produite")).not.toBeInTheDocument();
});
it("replaces broken and missing images with placeholders", async () => {
  setup();
  await screen.findByText("Coût complet");
  expect(
    screen.getByRole("img", {
      name: "Aucune image pour Structure de 3 arches",
    }),
  ).toBeVisible();
  for (const img of screen.getAllByRole("img", { name: bom.name }))
    fireEvent.error(img);
  expect(
    screen.getAllByRole("img", { name: `Aucune image pour ${bom.name}` }),
  ).toHaveLength(2);
});
it("renders loading and retryable list errors", async () => {
  const get = vi.spyOn(api, "get").mockRejectedValue(new Error("Indisponible"));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [{ path: "/boms", element: <BomsPage /> }],
    { initialEntries: ["/boms"] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  expect(screen.getByText("Chargement des compositions…")).toBeVisible();
  expect(await screen.findByRole("alert")).toBeVisible();
  get.mockResolvedValue({ data: [] });
  await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  await waitFor(() =>
    expect(screen.getByText("Aucune composition.")).toBeVisible(),
  );
});

it("paginates and sorts the complete list while preserving unrelated URL state", async () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({
    ...bom,
    id: `bom-${i + 1}`,
    name: `Composition ${String(i + 1).padStart(2, "0")}`,
    costing: null,
  }));
  vi.spyOn(api, "get").mockImplementation(async (url) => ({
    data: url === "/boms" ? rows : rows.find((b) => url === `/boms/${b.id}`),
  }));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [{ path: "/boms", element: <BomsPage /> }],
    { initialEntries: ["/boms?custom=keep"] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByText("Coût non évalué");
  expect(
    within(screen.getByLabelText("Liste des compositions")).getAllByRole(
      "button",
    ),
  ).toHaveLength(10);
  await userEvent.click(screen.getByRole("button", { name: "Suivant" }));
  expect(router.state.location.search).toContain("page=2");
  expect(screen.getByText("Page 2 sur 2")).toBeVisible();
  expect(
    within(screen.getByLabelText("Liste des compositions")).getAllByRole(
      "button",
    ),
  ).toHaveLength(2);
  await userEvent.click(screen.getByRole("combobox", { name: "Tri" }));
  await userEvent.click(screen.getByRole("option", { name: "Nom : Z à A" }));
  expect(router.state.location.search).not.toContain("page=");
  expect(router.state.location.search).toContain("custom=keep");
  expect(
    within(screen.getByLabelText("Liste des compositions")).getAllByRole(
      "button",
    )[0],
  ).toHaveTextContent("Composition 12");
});
it("keeps the selected identity and actions available during detail loading and errors", async () => {
  let rejectDetail: (error: Error) => void = () => {
    throw new Error("Detail request not started");
  };
  const get = vi.spyOn(api, "get").mockImplementation(async (url) => {
    if (url === "/boms") return { data: [{ ...bom, costing: null }] };
    return new Promise((_resolve, reject) => {
      rejectDetail = reject;
    });
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [{ path: "/boms", element: <BomsPage /> }],
    { initialEntries: ["/boms?selected=bom-1"] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  expect(
    await screen.findByText("Chargement de la composition…"),
  ).toBeVisible();
  expect(screen.getByRole("link", { name: "Modifier" })).toBeVisible();
  rejectDetail(new Error("Détail indisponible"));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Impossible de charger la composition.",
  );
  get.mockResolvedValue({ data: bom });
  await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(await screen.findByText("Coût complet")).toBeVisible();
});

it("combines composition filters, resets navigation, and retains units from the entire list", async () => {
  const rows = [
    {
      ...bom,
      name: "Pain",
      components: [
        { resourceId: "r", componentName: "Farine", quantity: 1, unit: "kg" },
      ],
      activities: [{ type: "PREP", minutes: 20, sequence: 1 }],
      costing: null,
    },
    {
      ...bom,
      id: "arches",
      name: "Arches",
      type: "MATERIAL",
      yield: { quantity: 3, unit: "piece" },
      costing: null,
    },
    {
      ...bom,
      id: "montage",
      name: "Montage",
      type: "MATERIAL",
      yield: { quantity: 1, unit: "piece" },
      activities: [{ type: "INSTALLATION", minutes: 60, sequence: 1 }],
      costing: null,
    },
  ];
  const get = vi.spyOn(api, "get").mockImplementation(async (url) => ({
    data:
      url === "/boms" ? rows : rows.find((row) => url === `/boms/${row.id}`),
  }));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [{ path: "/boms", element: <BomsPage /> }],
    { initialEntries: ["/boms?custom=keep&size=20&page=2&selected=bom-1"] },
  );
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByText("Coût non évalué");
  const filter = async (name: string, option: string) => {
    await user.click(screen.getByRole("combobox", { name }));
    await user.click(screen.getByRole("option", { name: option }));
  };
  const names = () =>
    within(screen.getByLabelText("Liste des compositions"))
      .getAllByRole("button")
      .map((button) => button.textContent);
  await filter("Type de composition", "Matériel");
  expect(names()).toHaveLength(2);
  expect(router.state.location.search).toContain("type=MATERIAL");
  expect(router.state.location.search).not.toMatch(/page=|selected=/);
  await user.click(
    screen.getByRole("combobox", { name: "Unité de rendement" }),
  );
  expect(screen.getByRole("option", { name: "portion" })).toBeVisible();
  await user.click(screen.getByRole("option", { name: "piece" }));
  await filter("Activité", "Installation");
  expect(names()).toHaveLength(1);
  expect(names()[0]).toContain("Montage");
  await filter("Composants", "Sans composant");
  expect(names()).toHaveLength(1);
  await filter("Composants", "Avec composants");
  expect(
    screen.getByText(
      "Aucune composition ne correspond aux filtres sélectionnés.",
    ),
  ).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: "Réinitialiser les filtres" }),
  );
  expect(names()).toHaveLength(3);
  expect(router.state.location.search).toBe("?custom=keep&size=20");
  await filter("Activité", "Sans activité");
  expect(names()).toHaveLength(1);
  expect(names()[0]).toContain("Arches");
  await filter("Activité", "Préparation");
  expect(names()[0]).toContain("Pain");
  await filter("Type de composition", "Alimentaire");
  await filter("Composants", "Avec composants");
  expect(names()).toHaveLength(1);
  expect(names()[0]).toContain("Pain");
  expect(get.mock.calls.filter(([url]) => url === "/boms")).toHaveLength(1);
  expect(get.mock.calls.every(([url]) => !String(url).includes("/price"))).toBe(
    true,
  );
}, 10_000);

it("restores combined filters from a direct URL", async () => {
  const { router } = setup(
    "/boms?type=MATERIAL&unit=piece&activity=NONE&components=WITHOUT&custom=keep",
  );
  await screen.findByText("Coût non évalué");
  const list = screen.getByLabelText("Liste des compositions");
  expect(within(list).getAllByRole("button")).toHaveLength(1);
  expect(within(list).getByRole("button")).toHaveTextContent(
    "Structure de 3 arches",
  );
  expect(
    screen.getByRole("combobox", { name: "Type de composition" }),
  ).toHaveTextContent("Matériel");
  expect(
    screen.getByRole("combobox", { name: "Unité de rendement" }),
  ).toHaveTextContent("piece");
  expect(screen.getByRole("combobox", { name: "Activité" })).toHaveTextContent(
    "Sans activité",
  );
  expect(router.state.location.search).toContain("custom=keep");
});
