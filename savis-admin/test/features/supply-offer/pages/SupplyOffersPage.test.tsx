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
});

function mockPageState(
  queryOverrides: Partial<ReturnType<typeof useSupplyOffers>["query"]>,
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
    setSearch: vi.fn(),
    setStatus: vi.fn(),
    setSort: vi.fn(),
  });
}
