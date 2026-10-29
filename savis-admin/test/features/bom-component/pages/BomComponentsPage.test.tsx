import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { BomComponentsPage } from "@/features/bom-component/pages/BomComponentsPage";
import {
  getBomComponents,
  getBomComponentSearchTermFacets,
  patchBomComponent,
  deleteBomComponent,
} from "@/features/bom-component/api/bomComponentApi";
import type { BomComponent } from "@/features/bom-component/types";

vi.mock("@/features/bom-component/api/bomComponentApi", () => ({
  getBomComponents: vi.fn(),
  getBomComponentSearchTermFacets: vi.fn(),
  patchBomComponent: vi.fn(),
  deleteBomComponent: vi.fn(),
}));

const offer = (id: string): BomComponent => ({
  id,
  label: `Farine ${id}`,
  brand: "Marque",
  status: "NEW",
  search_term: "farine",
  external_id: id,
  url: "https://example.com/product",
  image_url: "",
  type: "FOOD",
  provider: {
    name: "Maxi",
    identifier: "maxi",
    site: "https://example.com",
    address: "",
  },
  price: { amount: "3.50", currency: "CAD" },
  package_size: { value: 1, unit: "kg" },
  last_retrieved_at: "2026-10-20T12:00:00Z",
  next_refresh_at: "2026-10-21T12:00:00Z",
  refresh_frequency_hours: 24,
  last_seen_task_id: "task",
});
// Radix Select uses scrolling, which JSDOM does not implement.
beforeAll(() =>
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  }),
);
afterAll(() => Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView"));
let offers: BomComponent[];
function mount(entry = "/bom-components") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <BomComponentsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("Procurement review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    offers = [offer("1"), offer("2")];
    vi.mocked(getBomComponents).mockImplementation(async (params) => {
      const items = offers.filter(
        (item) => !params.status || item.status === params.status,
      );
      return {
        items,
        page: params.page,
        size: params.size,
        total_items: items.length,
        total_pages: 1,
      };
    });
    vi.mocked(getBomComponentSearchTermFacets).mockResolvedValue([
      { search_term: "farine", count: 2 },
    ]);
    vi.mocked(patchBomComponent).mockImplementation(async (id, patch) => {
      const item = offers.find((item) => item.id === id)!;
      Object.assign(item, patch);
      return { ...item };
    });
  });

  it("keeps primary review actions separate from the other actions for a single offer", async () => {
    offers = [offer("1")];
    mount();
    const details = await screen.findByRole("region", {
      name: "Détail de Farine 1",
    });
    const actions = within(details).getByRole("group", {
      name: "Validation de l'offre",
    });
    expect(
      within(actions).getByRole("button", { name: "Valider" }),
    ).toBeEnabled();
    expect(
      within(actions).getByRole("button", { name: "Rejeter" }),
    ).toBeEnabled();
    expect(
      within(details).getByRole("button", { name: "Modifier" }),
    ).toBeInTheDocument();
    expect(
      within(details).getByRole("button", { name: "Supprimer" }),
    ).toBeInTheDocument();
    expect(
      within(details).getByRole("link", { name: /Voir le produit chez/ }),
    ).toBeInTheDocument();
  });

  it("marks the selected offer and preserves selection when returning to the list", async () => {
    const user = userEvent.setup();
    mount();
    const first = await screen.findByRole("button", {
      name: "Consulter Farine 1",
    });
    const second = screen.getByRole("button", { name: "Consulter Farine 2" });
    expect(first).toHaveAttribute("aria-pressed", "true");
    await user.click(second);
    expect(second).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("region", { name: "Détail de Farine 2" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retour à la liste" }));
    expect(second).toHaveAttribute("aria-pressed", "true");
  });

  it("defaults to NEW, opens details and advances after validation without deleting", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("button", { name: "Consulter Farine 1" });
    expect(getBomComponents).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "NEW", page: 1 }),
    );
    await user.click(
      screen.getByRole("button", { name: "Consulter Farine 1" }),
    );
    expect(
      screen.getByRole("region", { name: "Détail de Farine 1" }),
    ).toHaveTextContent("Toutes les 24 h");
    expect(
      screen.getByRole("link", { name: /Voir le produit chez/ }),
    ).toHaveAttribute("rel", "noopener noreferrer");
    await user.click(screen.getByRole("button", { name: "Valider" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Consulter Farine 1" }),
      ).not.toBeInTheDocument(),
    );
    expect(patchBomComponent).toHaveBeenCalledWith("1", { status: "VALID" });
    expect(deleteBomComponent).not.toHaveBeenCalled();
    expect(
      screen.getByRole("region", { name: "Détail de Farine 2" }),
    ).toBeInTheDocument();
    expect(getBomComponentSearchTermFacets).toHaveBeenCalledTimes(2);
  });

  it("confirms rejection and removes the offer from the active filter", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("button", { name: "Consulter Farine 1" });
    await user.click(screen.getByRole("button", { name: "Rejeter" }));
    expect(patchBomComponent).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirmer" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Consulter Farine 1" }),
      ).not.toBeInTheDocument(),
    );
    expect(patchBomComponent).toHaveBeenCalledWith("1", { status: "REJECTED" });
  });

  it.each(["VALID", "REJECTED"] as const)(
    "reads the %s filter from the URL",
    async (status) => {
      offers[0].status = status;
      mount(`/bom-components?status=${status}`);
      await screen.findByRole("button", { name: "Consulter Farine 1" });
      expect(getBomComponents).toHaveBeenLastCalledWith(
        expect.objectContaining({ status }),
      );
      expect(
        screen.queryByRole("button", { name: "Consulter Farine 2" }),
      ).not.toBeInTheDocument();
    },
  );

  it("changes the status filter and preserves retrieval and task navigation", async () => {
    const user = userEvent.setup();
    offers[1].status = "VALID";
    mount();
    await screen.findByRole("button", { name: "Consulter Farine 1" });
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "Statut de validation" }),
      { key: "Enter" },
    );
    await user.click(screen.getByRole("option", { name: "Validées" }));
    await screen.findByRole("button", { name: "Consulter Farine 2" });
    expect(
      screen.getByRole("link", { name: "Tâches d'acquisition" }),
    ).toHaveAttribute("href", "/bom-components/tasks");
    expect(
      screen.getByRole("button", { name: /Récupérer/i }),
    ).toBeInTheDocument();
  });

  it("shows errors with retry, loading, and empty results", async () => {
    vi.mocked(getBomComponents).mockRejectedValueOnce(
      new Error("indisponible"),
    );
    mount();
    expect(screen.getByLabelText("Chargement des offres")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de charger",
    );
    offers = [];
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(
      await screen.findByText(
        "Aucune offre ne correspond aux filtres sélectionnés.",
      ),
    ).toBeInTheDocument();
  });
});
