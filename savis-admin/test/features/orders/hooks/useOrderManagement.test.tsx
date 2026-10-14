import { useOrderManagement } from "@/features/orders/hooks/useOrderManagement";
import {
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
    vi.mocked(useImportOrders).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
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
