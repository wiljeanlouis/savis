import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useGetBoms } from "@/features/bom/hooks/useBomApi";
import {
  useAnalyzeProductPricing,
  useAnalyzeWorstCasePricing,
  useCatalogProducts,
  useDeleteCatalogProduct,
  useProductCategories,
  usePublishProduct,
  useSaveCatalogProduct,
  useUnpublishProduct,
} from "./useCatalogApi";
import type { CatalogProduct, ProductPricingAnalysis } from "../types";

export function useCatalogProductManagement() {
  const productsQuery = useCatalogProducts();
  const categoriesQuery = useProductCategories();
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
    } catch {
      toast.error("Impossible de sauvegarder le produit.");
      throw new Error("Unable to save catalog product");
    }
  };

  const deleteProduct = (productId: string | null) => {
    if (!productId) {
      return;
    }
    deleteProductMutation.mutate(productId);
  };

  const publishProduct = (product: CatalogProduct) => {
    if (!product.id) {
      return;
    }

    publishProductMutation.mutate(product.id, {
      onSuccess: () => toast.success("Produit publié vers SavouretPlus."),
      onError: (error) => toast.error(publicationErrorMessage(error)),
    });
  };

  const unpublishProduct = (product: CatalogProduct) => {
    if (!product.id) {
      return;
    }

    unpublishProductMutation.mutate(product.id, {
      onSuccess: () => toast.success("Produit retiré de SavouretPlus."),
      onError: (error) => toast.error(publicationErrorMessage(error)),
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
      onError: () => toast.error("L’analyse de rentabilité a échoué."),
    });
  };

  return {
    products: productsQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    boms: bomsQuery.data ?? [],
    analysis,
    isLoading:
      productsQuery.isPending ||
      categoriesQuery.isPending ||
      bomsQuery.isPending,
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

function publicationErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return (
      error.response?.data?.detail ?? "La publication vers Supabase a échoué."
    );
  }
  return "La publication vers Supabase a échoué.";
}
