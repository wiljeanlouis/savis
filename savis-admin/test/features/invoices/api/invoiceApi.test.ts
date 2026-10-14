import {
  createInvoiceFromOrder,
  getInvoiceDocument,
  getInvoices,
  issueInvoice,
} from "@/features/invoices/api/invoiceApi";
import { api } from "@/shared/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

describe("invoiceApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates from an order and uses the dedicated issue endpoint", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: "invoice-1" } })
      .mockResolvedValueOnce({ data: { id: "invoice-1", status: "ISSUED" } });

    await createInvoiceFromOrder("order-1");
    await issueInvoice("invoice-1");

    expect(api.post).toHaveBeenNthCalledWith(1, "/invoices", {
      orderId: "order-1",
    });
    expect(api.post).toHaveBeenNthCalledWith(2, "/invoices/invoice-1/issue");
  });

  it("passes the optional server-side status filter", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await getInvoices("DRAFT");

    expect(api.get).toHaveBeenCalledWith("/invoices", {
      params: { status: "DRAFT" },
    });
  });

  it("fetches the persisted invoice PDF with its server filename", async () => {
    const content = new Blob(["pdf"], { type: "application/pdf" });
    vi.mocked(api.get).mockResolvedValue({
      data: content,
      headers: {
        "content-disposition": 'attachment; filename="facture-FAC-1.pdf"',
      },
    });

    await expect(getInvoiceDocument("invoice-1")).resolves.toEqual({
      content,
      fileName: "facture-FAC-1.pdf",
    });
  });
});
