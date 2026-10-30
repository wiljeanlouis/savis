import { getResourcesByIds } from "@/features/resource/api/resourceApi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSupplyOffers } from "@/features/supply-offer/hooks/useSupplyOffers";
import { SupplyOffersPage } from "@/features/supply-offer/pages/SupplyOffersPage";
import { render as baseRender, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/resource/api/resourceApi", () => ({
  getResourcesByIds: vi.fn(),
}));

vi.mock("@/features/supply-offer/hooks/useSupplyOffers", () => ({
  useSupplyOffers: vi.fn(),
}));

const render = (ui: React.ReactNode) =>
  baseRender(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );

describe("SupplyOffersPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves shared resource names with a single bounded read for the offer page", async () => {
    vi.mocked(getResourcesByIds).mockResolvedValue([
      { id: "resource-1", name: "Farine de blé" },
    ] as never);
    mockPageState({
      data: {
        content: [
          { ...offer, resourceId: "resource-1" },
          { ...offer, id: "offer-second", resourceId: "resource-1" },
        ],
        page: 0,
        size: 20,
        totalElements: 2,
        totalPages: 1,
      },
    });
    render(<SupplyOffersPage />);
    expect(await screen.findAllByText("Farine de blé")).toHaveLength(2);
    expect(getResourcesByIds).toHaveBeenCalledExactlyOnceWith(["resource-1"]);
    expect(screen.queryByText("resource-1")).not.toBeInTheDocument();
  });

  it("renders the loading state", () => {
    mockPageState({ isPending: true });
    render(<SupplyOffersPage />);

    expect(screen.getByLabelText("Chargement des offres")).toBeInTheDocument();
  });

  it("renders an empty state", () => {
    mockPageState({
      data: {
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
      },
    });
    render(<SupplyOffersPage />);

    expect(
      screen.getByText("Aucune offre ne correspond aux filtres sélectionnés."),
    ).toBeInTheDocument();
  });

  it("offers a retry action after a loading error", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockPageState({ isError: true, refetch });
    render(<SupplyOffersPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Impossible de charger les offres fournisseurs.",
    );
    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("clears the availability filter and closes the popover with keyboard focus restored", async () => {
    const setStatus = vi.fn();
    mockPageState(
      {
        data: {
          content: [offer],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      },
      { setStatus },
    );
    render(<SupplyOffersPage />);
    const trigger = screen.getByRole("button", { name: "Filtres · 1" });
    await userEvent.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "Filtres des offres fournisseurs" }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Effacer les filtres" }),
    );
    expect(setStatus).toHaveBeenCalledWith("ALL");
    await userEvent.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Rechercher" }));
    expect(
      screen.getByRole("textbox", {
        name: "Rechercher dans les offres fournisseurs",
      }),
    ).toHaveFocus();
  });

  it("presents sorting and pagination like offer management", async () => {
    const user = userEvent.setup();
    const setPage = vi.fn();
    const setPageSize = vi.fn();
    const setSort = vi.fn();
    mockPageState(
      {
        data: {
          content: [offer],
          page: 0,
          size: 20,
          totalElements: 25,
          totalPages: 2,
        },
      },
      {
        sort: "price,desc",
        setPage,
        setPageSize,
        setSort,
      },
    );
    render(<SupplyOffersPage />);

    expect(
      screen.getByPlaceholderText("Rechercher dans les offres fournisseurs"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rechercher" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Disponibilité" }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Filtres · 1" }));
    expect(
      screen.getByRole("combobox", { name: "Disponibilité" }),
    ).toHaveTextContent("Disponibles");
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("combobox", { name: "Trier les offres par" }),
    ).toBeNull();
    expect(
      screen.getByRole("columnheader", { name: "Prix du paquet" }),
    ).toHaveAttribute("aria-sort", "descending");
    await user.click(screen.getByRole("button", { name: "Prix du paquet" }));
    expect(setSort).toHaveBeenCalledWith("price,asc");
    await user.click(screen.getByRole("button", { name: "Composant" }));
    expect(setSort).toHaveBeenCalledWith("componentName,asc");
    await user.click(
      screen.getByRole("button", { name: "Dernière observation" }),
    );
    expect(setSort).toHaveBeenCalledWith("lastSeen,asc");
    expect(screen.queryByRole("button", { name: "Fournisseur" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ressource" })).toBeNull();
    expect(
      screen.getByRole("combobox", { name: "Résultats par page" }),
    ).toHaveTextContent("20");
    const count = screen.getByText("25 offres");
    expect(
      count.compareDocumentPosition(screen.getByRole("table")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("Page 1 sur 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Précédent" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    expect(setPage).toHaveBeenCalledWith(1);
  });
});

function mockPageState(
  queryOverrides: Partial<ReturnType<typeof useSupplyOffers>["query"]>,
  stateOverrides: Partial<
    Omit<ReturnType<typeof useSupplyOffers>, "query">
  > = {},
) {
  vi.mocked(useSupplyOffers).mockReturnValue({
    query: {
      data: undefined,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
      ...queryOverrides,
    } as ReturnType<typeof useSupplyOffers>["query"],
    page: 0,
    pageSize: 20,
    search: "",
    status: "AVAILABLE",
    sort: "lastSeen,desc",
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    setSearch: vi.fn(),
    setStatus: vi.fn(),
    setSort: vi.fn(),
    ...stateOverrides,
  });
}

const offer = {
  resourceId: null,
  id: "offer-1",
  componentName: "Farine",
  label: "Farine tout usage",
  brand: "Sans nom",
  imageUrl: null,
  url: null,
  provider: { name: "Maxi", identifier: "maxi", site: null },
  price: { amount: 3.75, currency: "CAD" },
  packageSize: { value: 1, unit: "kg" },
  status: "AVAILABLE" as const,
  lastSeen: "2026-10-14T12:00:00",
};
