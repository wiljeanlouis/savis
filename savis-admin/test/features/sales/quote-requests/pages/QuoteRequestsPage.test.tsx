import { beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QuoteRequestsPage } from "@/features/sales/quote-requests/pages/QuoteRequestsPage";
const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  list: vi.fn(),
  importResult: undefined as
    | {
        fetched: number;
        imported: number;
        alreadyImported: number;
        failed: number;
        acknowledgmentFailed: number;
        failures: {
          externalId: string | null;
          code: string;
          reason?: string;
        }[];
      }
    | undefined,
  importError: null as unknown,
}));
vi.mock("@/features/sales/quote-requests/hooks/useQuoteRequests", () => ({
  useRequests: mocks.list,
  useImportRequests: () => ({
    mutate: mocks.mutate,
    isPending: false,
    isError: Boolean(mocks.importError),
    error: mocks.importError,
    data: mocks.importResult,
  }),
}));
function Location() {
  return <output aria-label="URL">{useLocation().search}</output>;
}
function mount(entry = "/sales/quote-requests") {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <QuoteRequestsPage />
      <Location />
    </MemoryRouter>,
  );
}
describe("QuoteRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.importResult = undefined;
    mocks.importError = null;
    mocks.list.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        content: [
          {
            publicId: "request",
            customerName: "Marie",
            receivedAt: "2026-10-31T12:00:00Z",
            status: "RECEIVED",
          },
        ],
        totalElements: 45,
      },
    });
  });
  it("présente les demandes en tableau et réutilise la pagination du projet", async () => {
    const user = userEvent.setup();
    mount();
    expect(
      screen.getByRole("columnheader", { name: "Client" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Consulter la demande de Marie" }),
    ).toHaveAttribute("href", "/sales/quote-requests/request");
    expect(screen.getByText("Page 1 sur 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    expect(screen.getByLabelText("URL")).toHaveTextContent("page=1");
  });
  it("conserve les filtres en URL et revient à la première page lors d’une recherche", async () => {
    const user = userEvent.setup();
    mount("/sales/quote-requests?page=2&status=RECEIVED&sort=receivedAt,asc");
    await user.type(
      screen.getByRole("textbox", { name: "Rechercher un client" }),
      "Marie",
    );
    expect(screen.getByLabelText("URL")).toHaveTextContent("status=RECEIVED");
    expect(screen.getByLabelText("URL")).toHaveTextContent("search=Marie");
    expect(screen.getByLabelText("URL")).not.toHaveTextContent("page=");
    await user.click(
      screen.getByRole("button", { name: "Importer les demandes" }),
    );
    expect(mocks.mutate).toHaveBeenCalledOnce();
  });
  it("affiche un état vide sans masquer les filtres", () => {
    mocks.list.mockReturnValue({
      isPending: false,
      isError: false,
      data: { content: [], totalElements: 0 },
    });
    mount();
    expect(
      screen.getByText(/Aucune demande ne correspond/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Rechercher un client" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();
  });

  it("affiche le résultat d’importation dans l’alerte fermable partagée", async () => {
    mocks.importResult = {
      fetched: 2,
      imported: 1,
      alreadyImported: 1,
      failed: 0,
      acknowledgmentFailed: 0,
      failures: [],
    };
    const user = userEvent.setup();
    mount();

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Demandes de soumission");
    expect(alert).toHaveTextContent("1 importées");
    expect(
      screen.getByRole("button", {
        name: "Fermer le message d’importation",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Fermer le message d’importation",
      }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});
