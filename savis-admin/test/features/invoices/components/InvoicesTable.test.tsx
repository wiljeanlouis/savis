import { InvoicesTable } from "@/features/invoices/components/InvoicesTable";
import type { Invoice } from "@/features/invoices/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

const base: Invoice = {
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

describe("InvoicesTable", () => {
  it("links the source order and only offers a final PDF after issuance", async () => {
    const user = userEvent.setup();
    const download = vi.fn();
    const issued = {
      ...base,
      id: "invoice-2",
      invoiceNumber: "FAC-00000001",
      status: "ISSUED",
      issuedAt: "2026-10-13T13:00:00Z",
    } satisfies Invoice;

    render(
      <MemoryRouter>
        <InvoicesTable invoices={[base, issued]} onDownload={download} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Brouillon · ADM-00000001")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "ADM-00000001" })[0],
    ).toHaveAttribute("href", "/orders/order-1");
    expect(screen.getAllByRole("button", { name: "PDF" })).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "PDF" }));
    expect(download).toHaveBeenCalledWith("invoice-2");
  });
});
