import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, beforeAll } from "vitest";
import { QualificationForm } from "@/features/sales/quote-requests/components/QualificationForm";
import type {
  QuoteRequest,
  Qualification,
} from "@/features/sales/quote-requests/model/types";

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/features/sales/quote-requests/hooks/useQuoteRequests", () => ({
  useSaveQualification: () => ({ mutate: mocks.mutate, isPending: false }),
}));
vi.mock("@/features/catalog/hooks/useCatalogApi", () => ({
  useCatalogProductsByIds: () => ({ data: [], isPending: false }),
  useCatalogProductSearch: () => ({ data: [], isPending: false }),
}));
// Keep this test focused on preparation state and saving, independent of Catalog widgets.
vi.mock(
  "@/features/sales/quote-requests/components/QualificationProducts",
  () => ({
    QualificationProducts: () => null,
  }),
);
const qualification: Qualification = {
  customerName: "Corrigé",
  customerPhone: "5145550123",
  customerEmail: null,
  internalNotes: "Notes conservées",
  exclusions: { "service:organisation": "Non proposé" },
  lines: [
    {
      id: "manual-line",
      productId: "product",
      quantity: 17,
      purchaseModeCode: "dozen",
      choiceCode: "chicken",
      allocations: [{ choiceCode: "beef", quantity: 12 }],
      ingredients: [{ ingredientCode: "sauce", quantity: 0 }],
      needKeys: ["item:0"],
    },
  ],
};
const request: QuoteRequest = {
  publicId: "request",
  source: "savouretplus",
  externalId: "external",
  submissionRequestId: null,
  status: "RECEIVED",
  version: 4,
  qualification: null,
  closedReason: null,
  customerName: "Original",
  customerPhone: "5145550123",
  customerEmail: null,
  originalPayload: "{}",
  receivedAt: "2026-10-31T12:00:00Z",
  importedAt: "2026-10-31T12:00:00Z",
  needKeys: ["item:0", "service:organisation"],
  preparation: { qualification, saved: false, needs: [] },
};
describe("QualificationForm", () => {
  beforeEach(() => vi.clearAllMocks());
  it("préremplit sans sauvegarder et conserve les données lors d’un rendu ultérieur", () => {
    const view = render(
      <QualificationForm
        request={request}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    expect(mocks.mutate).not.toHaveBeenCalled();
    fireEvent.change(
      screen.getByLabelText("Informations utiles au traitement"),
      { target: { value: "Ajustement manuel" } },
    );
    view.rerender(
      <QualificationForm
        request={{ ...request, version: 5 }}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer les modifications" }),
    );
    expect(mocks.mutate.mock.calls[0][0]).toEqual({
      id: "request",
      expectedVersion: 4,
      qualification: { ...qualification, internalNotes: "Ajustement manuel" },
    });
  });
  it("privilégie la qualification enregistrée sans réintroduire les lignes proposées", () => {
    const saved = {
      ...qualification,
      internalNotes: "Décision sauvegardée",
      lines: [{ ...qualification.lines[0], quantity: 29 }],
    };
    render(
      <QualificationForm
        request={{ ...request, qualification: saved }}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    expect(mocks.mutate).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer les modifications" }),
    );
    expect(mocks.mutate.mock.calls[0][0].qualification).toEqual(saved);
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
