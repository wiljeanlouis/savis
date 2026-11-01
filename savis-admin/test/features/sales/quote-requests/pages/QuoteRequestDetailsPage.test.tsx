import { beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { QuoteRequestDetailsPage } from "@/features/sales/quote-requests/pages/QuoteRequestDetailsPage";
vi.mock("@/features/sales/quote-requests/hooks/useQuoteRequests", () => ({
  useRequest: () => ({
    data: {
      publicId: "request",
      version: 0,
      status: "RECEIVED",
      qualification: null,
      customerName: "Marie",
      customerPhone: "5145550123",
      customerEmail: "marie@example.test",
      receivedAt: "2026-10-31T12:00:00Z",
      needKeys: [],
      originalPayload: JSON.stringify({
        requested_services: ["decoration"],
        event_details: {
          event_type: "Mariage",
          event_date: "2027-06-12",
          allergies: "Noix",
        },
        items: [],
      }),
    },
  }),
  useSaveRequestStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useProposals: () => ({ data: [], isPending: false }),
  useCreateProposal: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/features/catalog/hooks/useCatalogApi", () => ({
  useCatalogProductsByIds: () => ({ data: [], isPending: false }),
}));
describe("QuoteRequestDetailsPage", () => {
  it("ouvre une consultation structurée et sépare qualification et propositions", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/sales/quote-requests/request"]}>
        <Routes>
          <Route
            path="/sales/quote-requests/:requestId"
            element={<QuoteRequestDetailsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Demande de Marie" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mariage")).toBeInTheDocument();
    expect(screen.getByText("Noix")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enregistrer la qualification" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Qualification" }));
    expect(
      screen.getByRole("button", { name: "Qualifier la demande" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Devis associés" }));
    expect(screen.getByText("Aucun devis créé.")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Clôturer la demande" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmer la clôture" }),
    ).toBeDisabled();
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
