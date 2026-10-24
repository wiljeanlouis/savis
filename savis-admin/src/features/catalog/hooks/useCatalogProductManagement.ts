import { useState } from "react";
import { toast } from "sonner";
import { useGetBoms } from "@/features/bom/hooks/useBomApi";
import { getApiErrorMessage } from "@/shared/api/apiError";
import {
  useAnalyzeProductPricing,
  useAnalyzeWorstCasePricing,
  useCatalogProducts,
  useDeleteCatalogProduct,
  usePublishProduct,
  useSaveCatalogProduct,
  useUnpublishProduct,
} from "./useCatalogApi";
import type { CatalogProduct, ProductPricingAnalysis } from "../types";

export function useCatalogProductManagement() {
  const productsQuery = useCatalogProducts();
  const bomsQuery = useGetBoms();
  const saveProduct = useSaveCatalogProduct();
  const deleteProductMutation = useDeleteCatalogProduct();
  const publishProductMutation = usePublishProduct();
  const unpublishProductMutation = useUnpublishProduct();
  const analyze = useAnalyzeProductPricing();
  const analyzeWorstCase = useAnalyzeWorstCasePricing();

  const [analysis, setAnalysis] = useState<
    Record<string, ProductPricingAnalysis>
  >({});

  const saveProductForm = async (product: CatalogProduct) => {
    try {
      await saveProduct.mutateAsync(product);
      toast.success("Produit sauvegardé.");
    } catch (error) {
      toast.error("Impossible de sauvegarder le produit.", {
        description: getApiErrorMessage(error),
      });
      throw error;
    }
  };

  const deleteProduct = (productId: string | null) => {
    if (!productId) {
      return;
    }
    deleteProductMutation.mutate(productId, {
      onError: (error) =>
        toast.error("Impossible de supprimer le produit.", {
          description: getApiErrorMessage(error),
        }),
    });
  };

  const publishProduct = (product: CatalogProduct) => {
    if (!product.id) {
      return;
    }

    publishProductMutation.mutate(product.id, {
      onSuccess: () => toast.success("Produit publié vers SavouretPlus."),
      onError: (error) =>
        toast.error("La publication vers Supabase a échoué.", {
          description: getApiErrorMessage(error),
        }),
    });
  };

  const unpublishProduct = (product: CatalogProduct) => {
    if (!product.id) {
      return;
    }

    unpublishProductMutation.mutate(product.id, {
      onSuccess: () => toast.success("Produit retiré de SavouretPlus."),
      onError: (error) =>
        toast.error("Le retrait de Supabase a échoué.", {
          description: getApiErrorMessage(error),
        }),
    });
  };

  const runAnalysis = (product: CatalogProduct) => {
    if (!product.id) return;

    const bundleMode = product.purchaseModes.find(
      (mode) => mode.active && mode.allocationType === "CHOICE_ALLOCATION",
    );
    const mutation = bundleMode ? analyzeWorstCase : analyze;
    const variables = bundleMode
      ? { productId: product.id, purchaseModeCode: bundleMode.code }
      : {
          productId: product.id,
          configuration: {
            purchaseModeCode: defaultPurchaseMode(product)?.code ?? null,
            choiceCode:
              product.choiceGroup?.options.find((option) => option.active)
                ?.code ?? null,
            allocations: [],
            ingredients: product.ingredientOptions
              .filter((option) => option.active)
              .map((option) => ({
                ingredientCode: option.code,
                quantity: option.defaultQuantity,
              })),
          },
        };

    mutation.mutate(variables as never, {
      onSuccess: (result) =>
        setAnalysis((current) => ({ ...current, [product.id!]: result })),
      onError: (error) =>
        toast.error("L’analyse de rentabilité a échoué.", {
          description: getApiErrorMessage(error),
        }),
    });
  };

  return {
    products: productsQuery.data ?? [],
    boms: bomsQuery.data ?? [],
    analysis,
    isLoading: productsQuery.isPending || bomsQuery.isPending,
    isError: productsQuery.isError || bomsQuery.isError,
    error: productsQuery.error ?? bomsQuery.error,
    isSaving: saveProduct.isPending,
    isPublishing:
      publishProductMutation.isPending || unpublishProductMutation.isPending,
    saveProduct: saveProductForm,
    deleteProduct,
    publishProduct,
    unpublishProduct,
    runAnalysis,
  };
}

function defaultPurchaseMode(product: CatalogProduct) {
  return [...product.purchaseModes]
    .filter((mode) => mode.active)
    .sort(
      (left, right) =>
        left.displayOrder - right.displayOrder ||
        left.label.localeCompare(right.label) ||
        left.code.localeCompare(right.code),
    )[0];
}
