import { useBomList } from "@/features/bom/hooks/useBomList";
import {
  useDeleteBom,
  useGetBoms,
  usePostBom,
} from "@/features/bom/hooks/useBomApi";
import type { Bom } from "@/features/bom/types";
import { act, renderHook } from "@testing-library/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-router", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/features/bom/hooks/useBomApi", () => ({
  useGetBoms: vi.fn(),
  useDeleteBom: vi.fn(),
  usePostBom: vi.fn(),
}));

const bom: Bom = {
  id: "original-bom",
  name: "Boeuf bourguignon",
  type: "FOOD",
  description: "Recette originale",
  imageUrl: "https://example.com/bom.jpg",
  instructions: "Mijoter.",
  components: [
    {
      componentName: "Boeuf",
      quantity: 2,
      unit: "kg",
      selectedOfferId: "offer-1",
    },
  ],
  activities: [
    { id: 7, type: "PREP", minutes: 20, sequence: 1 },
    { id: 8, type: "COOK", minutes: 120, sequence: 2 },
  ],
  yield: { quantity: 6, unit: "portion" },
  price: { amount: 42, currency: "CAD" },
};

describe("useBomList", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useGetBoms).mockReturnValue({
      data: [bom],
      isPending: false,
      isError: false,
      error: null,
    } as never);
    vi.mocked(useDeleteBom).mockReturnValue({
      mutateAsync: vi.fn(),
    } as never);
  });

  it("clones a BOM without a client-generated id and opens the new copy", async () => {
    const mutateAsync = vi
      .fn()
      .mockResolvedValue("00000000-0000-4000-8000-000000000001");
    const navigate = vi.fn();
    vi.mocked(usePostBom).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);
    vi.mocked(useNavigate).mockReturnValue(navigate);

    const { result } = renderHook(() => useBomList());

    await act(async () => {
      await result.current.cloneBom(bom);
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      ...bom,
      id: null,
      name: "Boeuf bourguignon (copie)",
      price: null,
      components: [{ ...bom.components[0] }],
      activities: [
        { type: "PREP", minutes: 20, sequence: 1 },
        { type: "COOK", minutes: 120, sequence: 2 },
      ],
      yield: { ...bom.yield },
    });
    expect(toast.success).toHaveBeenCalledWith("BOM cloné avec succès.");
    expect(navigate).toHaveBeenCalledWith(
      "/boms/00000000-0000-4000-8000-000000000001",
    );
  });

  it("shows an error toast when cloning fails", async () => {
    const mutateAsync = vi.fn().mockRejectedValue({
      response: { data: { detail: "Nom invalide" } },
    });
    vi.mocked(usePostBom).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);
    vi.mocked(useNavigate).mockReturnValue(vi.fn());

    const { result } = renderHook(() => useBomList());

    await act(async () => {
      await result.current.cloneBom(bom);
    });

    expect(toast.error).toHaveBeenCalledWith("Le clonage du BOM a échoué.", {
      description: "Nom invalide",
    });
  });
});
