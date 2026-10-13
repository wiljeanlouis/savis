import { InvoiceDetailsPage } from "@/features/invoices/pages/InvoiceDetailsPage";
import {
  useCancelInvoice,
  useInvoice,
  useInvoiceDocumentPreview,
  useIssueInvoice,
  useUpdateInvoice,
} from "@/features/invoices/hooks/useInvoiceApi";
import type { Invoice } from "@/features/invoices/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/features/invoices/hooks/useInvoiceApi", () => ({
  useInvoice: vi.fn(),
  useUpdateInvoice: vi.fn(),
  useIssueInvoice: vi.fn(),
  useCancelInvoice: vi.fn(),
  useInvoiceDocumentPreview: vi.fn(),
}));

vi.mock("@/features/orders/components/OrderItemsDetails", () => ({
  OrderItemsDetails: () => <div>Articles figés</div>,
}));

const invoice: Invoice = {
  id: "invoice-1",
  invoiceNumber: null,
  sourceOrderId: "order-1",
  sourceOrderNumber: "ADM-00000001",
  status: "DRAFT",
  customerName: "Ada",
  customerPhone: "+15145550100",
  customerEmail: null,
  customerAddress: null,
  note: null,
  subtotalCents: 1000,
  discountCents: 0,
  deliveryFeeCents: 0,
  gstCents: 0,
  qstCents: 0,
  taxCents: 0,
  totalCents: 1000,
  createdAt: "2026-10-13T12:00:00Z",
  updatedAt: "2026-10-13T12:00:00Z",
  issuedAt: null,
  cancelledAt: null,
  items: [],
};

describe("InvoiceDetailsPage", () => {
  const update = vi.fn();
  const issue = vi.fn();
  const cancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    update.mockResolvedValue(invoice);
    issue.mockResolvedValue({ ...invoice, status: "ISSUED" });
    cancel.mockResolvedValue({ ...invoice, status: "CANCELLED" });
    vi.mocked(useInvoice).mockReturnValue({
      data: invoice,
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useUpdateInvoice).mockReturnValue({
      mutateAsync: update,
      isPending: false,
    } as never);
    vi.mocked(useIssueInvoice).mockReturnValue({
      mutateAsync: issue,
      isPending: false,
    } as never);
    vi.mocked(useCancelInvoice).mockReturnValue({
      mutateAsync: cancel,
      isPending: false,
    } as never);
    vi.mocked(useInvoiceDocumentPreview).mockReturnValue({
      open: vi.fn(),
      isPending: false,
    } as never);
  });

  it("edits draft adjustments and confirms issuance", async () => {
    const router = createMemoryRouter(
      [{ path: "/invoices/:invoiceId", element: <InvoiceDetailsPage /> }],
      { initialEntries: ["/invoices/invoice-1"] },
    );
    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Rabais (CAD)"), {
      target: { value: "1.25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    expect(update.mock.calls[0][0].request.discountCents).toBe(125);

    fireEvent.click(screen.getByRole("button", { name: "Émettre" }));
    await waitFor(() => expect(issue).toHaveBeenCalledWith("invoice-1"));
    expect(window.confirm).toHaveBeenCalled();
  });
});
