import {
  updateOrder,
  updateOrderCustomer,
} from "@/features/sales/orders/api/orderApi";
import type { CreateOrderRequest, Order } from "@/features/sales/orders/types";
import { api } from "@/shared/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}));

describe("orderApi", () => {
  beforeEach(() => vi.clearAllMocks());

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

  it("patches only the customer fields of a web order", async () => {
    const request = {
      customerName: "Ada",
      customerPhone: "514",
      customerEmail: null,
      customerAddress: null,
      note: "Note corrigée",
    };
    const order = { id: "order-1" } as Order;
    vi.mocked(api.patch).mockResolvedValue({ data: order });

    await expect(
      updateOrderCustomer({ orderId: "order-1", request }),
    ).resolves.toBe(order);

    expect(api.patch).toHaveBeenCalledWith("/orders/order-1/customer", request);
  });
});
