import { useSupplyOffers } from "@/features/supply-offer/hooks/useSupplyOffers";
import { SupplyOffersPage } from "@/features/supply-offer/pages/SupplyOffersPage";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/supply-offer/hooks/useSupplyOffers", () => ({
  useSupplyOffers: vi.fn(),
}));

describe("SupplyOffersPage", () => {
  beforeEach(() => vi.clearAllMocks());

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
      screen.getByRole("combobox", { name: "Filtrer par statut" }),
    ).toHaveTextContent("Disponibles");
    expect(
      screen.getByRole("combobox", { name: "Trier les offres par" }),
    ).toHaveTextContent("Prix du paquet");
    await user.click(screen.getByRole("button", { name: "Descendant" }));
    expect(setSort).toHaveBeenCalledWith("price,asc");

    expect(
      screen.getByRole("combobox", { name: "Résultats par page" }),
    ).toHaveTextContent("20");
    expect(screen.getByText("25 offres")).toBeInTheDocument();
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
