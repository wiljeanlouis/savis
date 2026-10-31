import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import type { CatalogProduct, ProductPurchaseMode } from "../../types";
import { analyzeProductPricing } from "../../api/catalogApi";
import { ProductModeComparison } from "./ProductModeComparison";

/** Choices are compared only at one equivalent, non-allocation purchase mode. */
export function ProductChoiceComparison({
  product,
  mode,
}: {
  product: CatalogProduct;
  mode: ProductPurchaseMode;
}) {
  const [enabled, setEnabled] = useState(false);
  const choices =
    product.choiceGroup?.options.filter((option) => option.active) ?? [];
  const analyses = useQueries({
    queries: choices.map((choice) => {
      const configuration = {
        purchaseModeCode: mode.code,
        choiceCode: choice.code,
        allocations: [],
        ingredients: product.ingredientOptions
          .filter((option) => option.active)
          .map((option) => ({
            ingredientCode: option.code,
            quantity: option.defaultQuantity,
          })),
      };
      return {
        queryKey: [
          "catalog-products",
          product.id,
          "pricing-analysis",
          configuration,
        ],
        queryFn: () =>
          analyzeProductPricing({ productId: product.id!, configuration }),
        enabled,
        staleTime: 30_000,
      };
    }),
  });
  return (
    <section className="space-y-3 rounded-xl border p-5">
      <h2 className="font-semibold">Comparaison des compositions au choix</h2>
      <p className="text-sm text-muted-foreground">
        Même mode de vente : {mode.label}. Chaque configuration conserve les
        compositions de base communes.
      </p>
      <Button
        variant="outline"
        onClick={() => setEnabled(true)}
        disabled={enabled}
      >
        Comparer les choix
      </Button>
      {enabled && (
        <ProductModeComparison
          title="Résultats par choix"
          modeLabel="Choix"
          description="Analyses des choix actifs pour le même mode de vente."
          modes={choices.map((choice) => ({
            ...mode,
            code: choice.code,
            label: choice.name,
          }))}
          analyses={analyses}
        />
      )}
    </section>
  );
}
