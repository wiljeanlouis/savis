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
  usePublishCatalog,
  useSaveCatalogProduct,
} from "./useCatalogApi";
import type { CatalogProduct, ProductPricingAnalysis } from "../types";

export function useCatalogProductManagement() {
  const productsQuery = useCatalogProducts();
  const categoriesQuery = useProductCategories();
  const bomsQuery = useGetBoms();
  const saveProduct = useSaveCatalogProduct();
  const deleteProductMutation = useDeleteCatalogProduct();
  const publishCatalog = usePublishCatalog();
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

  const publish = () => {
    publishCatalog.mutate(undefined, {
      onSuccess: ({ publishedProductCount }) =>
        publishedProductCount === 0
          ? toast.info("Aucun produit marqué « Publier » à envoyer.")
          : toast.success(
              `${publishedProductCount} produit${publishedProductCount > 1 ? "s" : ""} publié${publishedProductCount > 1 ? "s" : ""} vers Supabase.`,
            ),
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
            purchaseModeCode:
              product.purchaseModes.find((mode) => mode.active)?.code ?? null,
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
    isPublishing: publishCatalog.isPending,
    saveProduct: saveProductForm,
    deleteProduct,
    publish,
    runAnalysis,
  };
}

function publicationErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return (
      error.response?.data?.detail ?? "La publication vers Supabase a échoué."
    );
  }
  return "La publication vers Supabase a échoué.";
}
