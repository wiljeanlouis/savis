import { beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import { RequestProposals } from "@/features/sales/quote-requests/components/RequestProposals";
import type { QuoteRequest } from "@/features/sales/quote-requests/model/types";
const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/features/sales/quote-requests/hooks/useQuoteRequests", () => ({
  useProposals: () => ({ data: [], isPending: false, isError: false }),
  useCreateProposal: () => ({
    mutate: mocks.mutate,
    isPending: false,
    isError: false,
    reset: vi.fn(),
  }),
}));
const request: QuoteRequest = {
  closedReason: null,
  source: "savouretplus",
  externalId: "external",
  submissionRequestId: null,
  customerName: "Client",
  customerPhone: "5145550123",
  customerEmail: null,
  originalPayload: "{}",
  receivedAt: "2026-10-31T12:00:00Z",
  importedAt: "2026-10-31T12:00:00Z",
  publicId: "request",
  version: 4,
  status: "QUOTED",
  needKeys: ["service:traiteur"],
  qualification: {
    customerName: "Client",
    customerPhone: "5145550123",
    customerEmail: null,
    internalNotes: "Confidentiel",
    exclusions: {},
    lines: [
      {
        id: "line",
        productId: "product",
        quantity: 2,
        needKeys: ["service:traiteur"],
        purchaseModeCode: "unit",
        choiceCode: "",
        allocations: [],
        ingredients: [],
      },
    ],
  },
};
describe("RequestProposals", () => {
  beforeEach(() => vi.clearAllMocks());
  it("garde une intention stable au rejeu et ne transmet pas les notes internes", () => {
    const view = render(
      <MemoryRouter>
        <RequestProposals request={request} />
      </MemoryRouter>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Créer une soumission" }),
    );
    fireEvent.change(screen.getByLabelText("Date de validité"), {
      target: { value: "2027-01-01" },
    });
    fireEvent.change(screen.getByLabelText("Rabais ($)"), {
      target: { value: "1.25" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmer la création" }),
    );
    view.rerender(
      <MemoryRouter>
        <RequestProposals request={{ ...request, version: 5 }} />
      </MemoryRouter>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Réessayer la même proposition" }),
    );
    expect(mocks.mutate).toHaveBeenCalledTimes(2);
    expect(mocks.mutate.mock.calls[0][0]).toEqual(
      mocks.mutate.mock.calls[1][0],
    );
    expect(mocks.mutate.mock.calls[0][0].command.expectedVersion).toBe(4);
    expect(mocks.mutate.mock.calls[0][0].command.discountCents).toBe(125);
    expect(JSON.stringify(mocks.mutate.mock.calls[0][0])).not.toContain(
      "Confidentiel",
    );
  });
  it("crée une soumission partielle depuis les propositions sans qualification enregistrée", () => {
    const prepared = {
      ...request,
      qualification: null,
      needKeys: ["service:traiteur", "service:decoration"],
      preparation: {
        qualification: request.qualification!,
        saved: false,
        needs: [],
      },
    };
    render(
      <MemoryRouter>
        <RequestProposals request={prepared} />
      </MemoryRouter>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Créer une soumission" }),
    );
    fireEvent.change(screen.getByLabelText("Date de validité"), {
      target: { value: "2027-01-01" },
    });
    expect(
      screen.getByRole("button", { name: "Confirmer la création" }),
    ).toBeEnabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmer la création" }),
    );
    expect(mocks.mutate.mock.calls[0][0].command).toMatchObject({
      lineIds: ["line"],
      exclusions: {},
      expectedVersion: 4,
    });
  });
  it("conserve une exclusion explicite pour les besoins non inclus", () => {
    const partial = {
      ...request,
      needKeys: ["service:traiteur", "service:decoration"],
      qualification: {
        ...request.qualification!,
        exclusions: { "service:decoration": "Non proposé" },
      },
    };
    render(
      <MemoryRouter>
        <RequestProposals request={partial} />
      </MemoryRouter>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Créer une soumission" }),
    );
    fireEvent.change(screen.getByLabelText("Date de validité"), {
      target: { value: "2027-01-01" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmer la création" }),
    );
    expect(mocks.mutate.mock.calls[0][0].command.exclusions).toEqual({
      "service:decoration": "Non proposé",
    });
  });
  it("affiche explicitement une demande sans soumission", () => {
    render(
      <MemoryRouter>
        <RequestProposals request={request} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Aucune soumission créée.")).toBeInTheDocument();
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
