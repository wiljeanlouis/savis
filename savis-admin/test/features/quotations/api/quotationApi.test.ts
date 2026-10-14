import {
  convertQuotation,
  getQuotationDocument,
  updateQuotationStatus,
} from "@/features/quotations/api/quotationApi";
import { api } from "@/shared/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

describe("quotationApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the dedicated lifecycle and conversion endpoints", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { id: "quotation-1" } });
    vi.mocked(api.post).mockResolvedValue({ data: { orderId: "order-1" } });

    await updateQuotationStatus({ quotationId: "quotation-1", status: "SENT" });
    await expect(convertQuotation("quotation-1")).resolves.toEqual({
      orderId: "order-1",
    });

    expect(api.put).toHaveBeenCalledWith("/quotations/quotation-1/status", {
      status: "SENT",
    });
    expect(api.post).toHaveBeenCalledWith("/quotations/quotation-1/convert");
  });

  it("fetches the standalone PDF with its server filename", async () => {
    const content = new Blob(["pdf"], { type: "application/pdf" });
    vi.mocked(api.get).mockResolvedValue({
      data: content,
      headers: {
        "content-disposition": 'attachment; filename="soumission-SOU-1.pdf"',
      },
    });

    await expect(getQuotationDocument("quotation-1")).resolves.toEqual({
      content,
      fileName: "soumission-SOU-1.pdf",
    });
    expect(api.get).toHaveBeenCalledWith("/quotations/quotation-1/pdf", {
      responseType: "blob",
    });
  });
});
