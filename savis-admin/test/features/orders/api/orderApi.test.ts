import { getOrderDocument, updateOrder } from "@/features/orders/api/orderApi";
import type { CreateOrderRequest, Order } from "@/features/orders/types";
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

  it("replaces an administrative order through its detail endpoint", async () => {
    const request = {
      customerName: "Ada",
      customerPhone: "514",
      customerEmail: null,
      customerAddress: null,
      note: null,
      discountCents: 0,
      deliveryFeeCents: 0,
      items: [],
    } satisfies CreateOrderRequest;
    const order = { id: "order-1" } as Order;
    vi.mocked(api.put).mockResolvedValue({ data: order });

    await expect(updateOrder({ orderId: "order-1", request })).resolves.toBe(
      order,
    );

    expect(api.put).toHaveBeenCalledWith("/orders/order-1", request);
  });
});
