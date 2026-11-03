import {
  SalesWorkspaceDossierPage,
  SalesWorkspacePage,
} from "@/features/sales/workspace/pages/SalesWorkspacePage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  mutate: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  useMutation: () => ({
    mutate: mocks.mutate,
    isPending: false,
    isError: false,
  }),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

const dossier = {
  id: "REQUEST:11111111-1111-4111-8111-111111111111",
  customerName: "Marie Tremblay",
  reference: "DEM-11111111",
  description: null,
  lastActivity: "2026-10-31T12:00:00Z",
  situation: "1 branche facturée · 1 soumission en attente",
  root: {
    type: "REQUEST" as const,
    id: "11111111-1111-4111-8111-111111111111",
    reference: "DEM-11111111",
    status: "QUOTED",
    amountCents: null,
    lastActivity: "2026-10-31T12:00:00Z",
    action: "Préparer une soumission",
    actionUrl: "/sales/quote-requests/11111111-1111-4111-8111-111111111111",
    warnings: [],
    children: [
      {
        type: "QUOTATION" as const,
        id: "22222222-2222-4222-8222-222222222222",
        reference: "SOU-0018",
        status: "ACCEPTED",
        amountCents: 12000,
        lastActivity: "2026-10-31T12:00:00Z",
        action: "Consulter la soumission",
        actionUrl: "/quotations/22222222-2222-4222-8222-222222222222",
        warnings: [],
        children: [
          {
            type: "INVOICE" as const,
            id: "33333333-3333-4333-8333-333333333333",
            reference: "FAC-0009",
            status: "ISSUED",
            amountCents: 12000,
            lastActivity: "2026-10-31T12:00:00Z",
            action: "Consulter la facture",
            actionUrl: "/invoices/33333333-3333-4333-8333-333333333333",
            warnings: [],
            children: [],
          },
        ],
      },
    ],
  },
};

function mount() {
  const router = createMemoryRouter(
    [
      { path: "/sales/workspace", element: <SalesWorkspacePage /> },
      {
        path: "/sales/workspace/:dossierId",
        element: <SalesWorkspaceDossierPage />,
      },
    ],
    { initialEntries: ["/sales/workspace"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("Sales workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useQuery.mockImplementation(
      ({ queryKey }: { queryKey: unknown[] }) =>
        queryKey.includes("dossier")
          ? { isPending: false, isError: false, data: dossier }
          : {
              isPending: false,
              isError: false,
              data: {
                content: [
                  {
                    id: dossier.id,
                    customerName: dossier.customerName,
                    reference: dossier.reference,
                    description: null,
                    lastActivity: dossier.lastActivity,
                    situation: dossier.situation,
                    documentCount: 4,
                  },
                ],
                totalElements: 1,
                totalPages: 1,
              },
            },
    );
  });

  it("recherche des dossiers et ouvre le parcours lié", async () => {
    const router = mount();
    const searchAndFilters = screen.getByRole("region", {
      name: "Recherche et filtres des dossiers",
    });
    const searchInput = screen.getByRole("textbox", {
      name: "Rechercher un client ou une référence",
    });
    expect(searchInput).toHaveAttribute(
      "placeholder",
      "Rechercher un client ou une référence",
    );
    const searchButton = screen.getByRole("button", { name: "Rechercher" });
    expect(searchButton).toBeInTheDocument();
    expect(searchInput.parentElement?.parentElement).toContainElement(
      searchButton,
    );
    expect(searchAndFilters).toContainElement(screen.getByRole("tablist"));
    expect(searchAndFilters).toHaveClass("sm:flex-row");

    expect(
      screen.getByRole("link", { name: "Marie Tremblay" }),
    ).toHaveAttribute(
      "href",
      "/sales/workspace/REQUEST%3A11111111-1111-4111-8111-111111111111",
    );
    fireEvent.click(screen.getByRole("link", { name: "Ouvrir le dossier" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toContain("/sales/workspace/");
    });
    expect(
      screen.getByText("1 branche facturée · 1 soumission en attente"),
    ).toBeInTheDocument();
    expect(screen.getByText("SOU-0018")).toBeInTheDocument();
    expect(screen.getByText("FAC-0009")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-icon-request")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-icon-quotation")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-icon-invoice")).toBeInTheDocument();
  });

  it("offre des branches repliables avec des statuts traduits", async () => {
    mount();
    fireEvent.click(screen.getByRole("link", { name: "Ouvrir le dossier" }));
    await screen.findByText("SOU-0018");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Afficher ou masquer les documents liés à DEM-11111111",
      }),
    );
    await waitFor(() => {
      expect(screen.queryByText("SOU-0018")).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Soumise/)).toBeInTheDocument();
  });
});
