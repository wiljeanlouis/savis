import { useGetBoms } from "@/features/bom/hooks/useBomApi";
import {
  useAnalyzeProductPricing,
  useAnalyzeWorstCasePricing,
  useCatalogProducts,
  useDeleteCatalogProduct,
  useProductCategories,
  usePublishCatalog,
  useSaveCatalogProduct,
} from "@/features/catalog/hooks/useCatalogApi";
import { useCatalogProductManagement } from "@/features/catalog/hooks/useCatalogProductManagement";
import {
  emptyCatalogProduct,
  emptyPurchaseMode,
  type CatalogProduct,
  type ProductPricingAnalysis,
} from "@/features/catalog/types";
import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/bom/hooks/useBomApi", () => ({
  useGetBoms: vi.fn(),
}));

vi.mock("@/features/catalog/hooks/useCatalogApi", () => ({
  useAnalyzeProductPricing: vi.fn(),
  useAnalyzeWorstCasePricing: vi.fn(),
  useCatalogProducts: vi.fn(),
  useDeleteCatalogProduct: vi.fn(),
  useProductCategories: vi.fn(),
  usePublishCatalog: vi.fn(),
  useSaveCatalogProduct: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

const product: CatalogProduct = {
  ...emptyCatalogProduct("category-1"),
  id: "product-1",
  code: "BOX",
  name: "Boîte découverte",
  purchaseModes: [
    {
      ...emptyPurchaseMode(),
      code: "dozen",
      active: true,
      allocationType: "NONE",
    },
  ],
  choiceGroup: {
    id: "choice-group-1",
    label: "Saveur",
    required: true,
    options: [
      {
        id: "choice-1",
        code: "vanilla",
        name: "Vanille",
        bomId: "bom-choice-1",
        active: true,
        displayOrder: 0,
      },
    ],
  },
  ingredientOptions: [
    {
      id: "ingredient-1",
      code: "sprinkles",
      name: "Confettis",
      bomId: "bom-ingredient-1",
      defaultQuantity: 2,
      minQuantity: 0,
      maxQuantity: 5,
      extraPrice: { amount: 1.25, currency: "CAD" },
      active: true,
      displayOrder: 0,
    },
  ],
};

const pricingResult: ProductPricingAnalysis = {
  analysisType: "CONFIGURATION",
  analyzedQuantity: 1,
  salePrice: { amount: 12, currency: "CAD" },
  unitCost: { amount: 5, currency: "CAD" },
  cost: { amount: 5, currency: "CAD" },
  actualMarginRate: 0.58,
  targetMarginRate: 0.3,
  recommendedPrice: { amount: 10, currency: "CAD" },
  status: "GOOD",
  complete: true,
  missingBomIds: [],
};

const setupApiMocks = () => {
  const saveMutateAsync = vi.fn().mockResolvedValue("product-1");
  const deleteMutate = vi.fn();
  const publishMutate = vi.fn();
  const analyzeMutate = vi.fn();
  const analyzeWorstCaseMutate = vi.fn();

  vi.mocked(useCatalogProducts).mockReturnValue({
    data: [product],
    isPending: false,
  } as never);
  vi.mocked(useProductCategories).mockReturnValue({
    data: [{ id: "category-1", code: "BOX", name: "Boîtes", active: true }],
    isPending: false,
  } as never);
  vi.mocked(useGetBoms).mockReturnValue({
    data: [{ id: "bom-1", name: "BOM 1" }],
    isPending: false,
  } as never);
  vi.mocked(useSaveCatalogProduct).mockReturnValue({
    mutateAsync: saveMutateAsync,
    isPending: false,
  } as never);
  vi.mocked(useDeleteCatalogProduct).mockReturnValue({
    mutate: deleteMutate,
  } as never);
  vi.mocked(usePublishCatalog).mockReturnValue({
    mutate: publishMutate,
    isPending: false,
  } as never);
  vi.mocked(useAnalyzeProductPricing).mockReturnValue({
    mutate: analyzeMutate,
  } as never);
  vi.mocked(useAnalyzeWorstCasePricing).mockReturnValue({
    mutate: analyzeWorstCaseMutate,
  } as never);

  return {
    analyzeMutate,
    analyzeWorstCaseMutate,
    deleteMutate,
    publishMutate,
    saveMutateAsync,
  };
};

describe("useCatalogProductManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes loaded products, categories and BOMs", () => {
    setupApiMocks();

    const { result } = renderHook(() => useCatalogProductManagement());

    expect(result.current.products).toEqual([product]);
    expect(result.current.categories).toEqual([
      { id: "category-1", code: "BOX", name: "Boîtes", active: true },
    ]);
    expect(result.current.boms).toEqual([{ id: "bom-1", name: "BOM 1" }]);
    expect(result.current.isLoading).toBe(false);
  });

  it("saves a product and shows a success toast", async () => {
    const { saveMutateAsync } = setupApiMocks();
    const { result } = renderHook(() => useCatalogProductManagement());

    await act(async () => {
      await result.current.saveProduct(product);
    });

    expect(saveMutateAsync).toHaveBeenCalledWith(product);
    expect(toast.success).toHaveBeenCalledWith("Produit sauvegardé.");
  });

  it("shows an error toast and rejects when saving fails", async () => {
    const { saveMutateAsync } = setupApiMocks();
    saveMutateAsync.mockRejectedValue(new Error("API error"));
    const { result } = renderHook(() => useCatalogProductManagement());

    await expect(result.current.saveProduct(product)).rejects.toThrow(
      "Unable to save catalog product",
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Impossible de sauvegarder le produit.",
    );
  });

  it("deletes only persisted products", () => {
    const { deleteMutate } = setupApiMocks();
    const { result } = renderHook(() => useCatalogProductManagement());

    act(() => {
      result.current.deleteProduct(null);
      result.current.deleteProduct("product-1");
    });

    expect(deleteMutate).toHaveBeenCalledTimes(1);
    expect(deleteMutate).toHaveBeenCalledWith("product-1");
  });

  it("publishes the catalog and delegates success handling to the mutation callbacks", () => {
    const { publishMutate } = setupApiMocks();
    const { result } = renderHook(() => useCatalogProductManagement());

    act(() => {
      result.current.publish();
    });

    expect(publishMutate).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );

    const callbacks = publishMutate.mock.calls[0][1];
    callbacks.onSuccess({ publishedProductCount: 2 });

    expect(toast.success).toHaveBeenCalledWith(
      "2 produits publiés vers Supabase.",
    );
  });

  it("runs a standard pricing analysis and stores the result by product id", () => {
    const { analyzeMutate } = setupApiMocks();
    analyzeMutate.mockImplementation((_variables, options) => {
      options.onSuccess(pricingResult);
    });
    const { result } = renderHook(() => useCatalogProductManagement());

    act(() => {
      result.current.runAnalysis(product);
    });

    expect(analyzeMutate).toHaveBeenCalledWith(
      {
        productId: "product-1",
        configuration: {
          purchaseModeCode: "dozen",
          choiceCode: "vanilla",
          allocations: [],
          ingredients: [{ ingredientCode: "sprinkles", quantity: 2 }],
        },
      },
      expect.any(Object),
    );
    expect(result.current.analysis["product-1"]).toEqual(pricingResult);
  });

  it("runs a worst-case analysis for choice allocation purchase modes", () => {
    const { analyzeMutate, analyzeWorstCaseMutate } = setupApiMocks();
    const bundleProduct: CatalogProduct = {
      ...product,
      purchaseModes: [
        {
          ...product.purchaseModes[0],
          code: "bundle",
          allocationType: "CHOICE_ALLOCATION",
        },
      ],
    };
    const { result } = renderHook(() => useCatalogProductManagement());

    act(() => {
      result.current.runAnalysis(bundleProduct);
    });

    expect(analyzeMutate).not.toHaveBeenCalled();
    expect(analyzeWorstCaseMutate).toHaveBeenCalledWith(
      { productId: "product-1", purchaseModeCode: "bundle" },
      expect.any(Object),
    );
  });
});
