import { useOrderManagement } from "@/features/orders/hooks/useOrderManagement";
import {
  useCreateOrder,
  useImportOrders,
  useOrders,
} from "@/features/orders/hooks/useOrderApi";
import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/features/orders/hooks/useOrderApi", () => ({
  useOrders: vi.fn(),
  useCreateOrder: vi.fn(),
  useImportOrders: vi.fn(),
}));

describe("useOrderManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOrders).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useCreateOrder).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
    vi.mocked(useImportOrders).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
  });

  it("creates an administrative order and reports its number", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      id: "order-id",
      orderNumber: "ADM-00000001",
    });
    vi.mocked(useCreateOrder).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);
    const request = {
      customerName: "Ada",
      customerPhone: "514",
      customerEmail: null,
      note: null,
      items: [
        {
          productId: "product-id",
          quantity: 1,
          purchaseModeCode: "unit",
          choiceCode: null,
          allocations: [],
          ingredients: [],
        },
      ],
    };

    const { result } = renderHook(() => useOrderManagement());
    let created = false;
    await act(async () => {
      created = await result.current.createAdminOrder(request);
    });

    expect(created).toBe(true);
    expect(mutateAsync).toHaveBeenCalledWith(request);
    expect(toast.success).toHaveBeenCalledWith(
      "Commande ADM-00000001 créée avec succès.",
    );
  });

  it("imports web orders and reports the imported count", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      fetchedCount: 2,
      importedCount: 2,
      alreadyImportedCount: 0,
      failedCount: 0,
      acknowledgmentFailedCount: 0,
      failures: [],
    });
    vi.mocked(useImportOrders).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);

    const { result } = renderHook(() => useOrderManagement());
    await act(async () => {
      await result.current.retrieveWebOrders();
    });

    expect(mutateAsync).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith(
      "2 commande(s) web importée(s) avec succès.",
    );
  });

  it("shows the API problem detail when retrieval fails", async () => {
    const mutateAsync = vi.fn().mockRejectedValue({
      response: { data: { detail: "Supabase indisponible" } },
    });
    vi.mocked(useImportOrders).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);

    const { result } = renderHook(() => useOrderManagement());
    await act(async () => {
      await result.current.retrieveWebOrders();
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Impossible de récupérer les commandes web.",
      { description: "Supabase indisponible" },
    );
  });
});
