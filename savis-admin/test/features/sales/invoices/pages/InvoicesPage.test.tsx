import { InvoicesPage } from "@/features/sales/invoices/pages/InvoicesPage";
import type { Invoice } from "@/features/sales/invoices/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invoices: vi.fn() }));
vi.mock("@/features/sales/invoices/hooks/useInvoiceApi", () => ({
  useInvoices: mocks.invoices,
  useInvoiceDocumentPreview: () => ({
    open: vi.fn(),
    isPending: false,
  }),
}));

const makeInvoice = (index: number): Invoice => ({
  id: `invoice-${index}`,
  invoiceNumber: `FAC-${String(index).padStart(4, "0")}`,
  sourceOrderId: `order-${index}`,
  sourceOrderNumber: `CMD-${String(index).padStart(4, "0")}`,
  status: "ISSUED",
  paymentStatus: "UNPAID",
  paidAt: null,
  customerName: `Client ${index}`,
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
  createdAt: `2026-10-${String((index % 28) + 1).padStart(2, "0")}T12:00:00Z`,
  updatedAt: "2026-10-13T12:00:00Z",
  issuedAt: "2026-10-13T12:00:00Z",
  cancelledAt: null,
  items: [],
});

function Location() {
  return <output aria-label="URL">{useLocation().search}</output>;
}

function mount(entry = "/sales/invoices") {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <InvoicesPage />
      <Location />
    </MemoryRouter>,
  );
}

describe("InvoicesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.invoices.mockReturnValue({
      data: Array.from({ length: 21 }, (_, index) => makeInvoice(index + 1)),
      isPending: false,
      isError: false,
    });
  });

  it("affiche la recherche et la pagination de la liste des factures", async () => {
    const user = userEvent.setup();
    mount();

    expect(
      screen.getByRole("textbox", { name: "Rechercher une facture" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filtres" })).toBeInTheDocument();
    expect(screen.getByText("Page 1 sur 2")).toBeInTheDocument();
    expect(screen.queryByText("FAC-0001")).not.toBeInTheDocument();
    expect(screen.getByText("FAC-0021")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Suivant" }));
    expect(screen.getByLabelText("URL")).toHaveTextContent("page=2");
    expect(screen.getByText("FAC-0001")).toBeInTheDocument();
    expect(screen.queryByText("FAC-0021")).not.toBeInTheDocument();
  });

  it("conserve les contrôles de liste lorsque le registre est vide", () => {
    mocks.invoices.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    });
    mount();

    expect(
      screen.getByRole("textbox", { name: "Rechercher une facture" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 1 sur 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();
  });
});
