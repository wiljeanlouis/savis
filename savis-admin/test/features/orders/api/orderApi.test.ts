import { getOrderDocument } from "@/features/orders/api/orderApi";
import { api } from "@/shared/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

describe("orderApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("downloads a PDF and keeps the server-provided filename", async () => {
    const content = new Blob(["pdf"], { type: "application/pdf" });
    vi.mocked(api.get).mockResolvedValue({
      data: content,
      headers: {
        "content-disposition": 'attachment; filename="facture-ADM-1.pdf"',
      },
    });

    const result = await getOrderDocument("order-1", "invoice");

    expect(api.get).toHaveBeenCalledWith("/orders/order-1/documents/invoice", {
      responseType: "blob",
    });
    expect(result).toEqual({ content, fileName: "facture-ADM-1.pdf" });
  });
});
