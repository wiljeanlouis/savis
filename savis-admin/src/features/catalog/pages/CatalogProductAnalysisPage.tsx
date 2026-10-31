import { catalogReturnTo } from "../model/catalogProductNavigation";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useGetBoms } from "@/features/bom/hooks/useBomApi";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Button } from "@/shared/ui/button";
import { ProductAnalysisHeader } from "../components/pricing/ProductAnalysisHeader";
import { Spinner } from "@/shared/ui/spinner";
import {
  analyzeProductPricing,
  analyzeWorstCasePricing,
  getCatalogProduct,
} from "../api/catalogApi";
import type { CatalogProduct } from "../types";
import { ProductFinancialOverview } from "../components/pricing/ProductFinancialOverview";
import { ProductCostQuality } from "../components/pricing/ProductCostQuality";
import { ProductCompositionDetails } from "../components/pricing/ProductCompositionDetails";
import { ProductChoiceComparison } from "../components/pricing/ProductChoiceComparison";
import { ProductModeComparison } from "../components/pricing/ProductModeComparison";

export function CatalogProductAnalysisPage() {
  const { productId = "" } = useParams();
  const [params] = useSearchParams();
  const returnTo = catalogReturnTo(params.toString(), productId);
  const product = useQuery({
    queryKey: ["catalog-products", productId],
    queryFn: () => getCatalogProduct(productId),
    enabled: !!productId,
  });
  if (product.isPending)
    return (
      <div
        role="status"
        className="flex min-h-64 items-center justify-center gap-2"
      >
        <Spinner />
        Chargement de l’analyse…
      </div>
    );
  if (product.isError)
    return (
      <ApiErrorAlert
        title="Impossible de charger le produit."
        error={product.error}
      >
        <Button onClick={() => void product.refetch()}>Réessayer</Button>
        <Link to={returnTo}>Retour aux produits</Link>
      </ApiErrorAlert>
    );
  return <ProductAnalysis key={productId} product={product.data} />;
}

function ProductAnalysis({ product }: { product: CatalogProduct }) {
  const [params, setParams] = useSearchParams();
  const returnTo = catalogReturnTo(params.toString(), product.id!);
  const [choice, setChoice] = useState("");
  const boms = useGetBoms();
  const modes = [...product.purchaseModes]
    .filter((mode) => mode.active)
    .sort(
      (a, b) => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code),
    );
  const choices =
    product.productType === "SINGLE_CHOICE" ||
    product.productType === "SINGLE_CHOICE_BUNDLE"
      ? (product.choiceGroup?.options.filter((option) => option.active) ?? [])
      : [];
  const choiceCode =
    choices.find((option) => option.code === choice)?.code ??
    choices[0]?.code ??
    "";
  const selected =
    modes.find((mode) => mode.code === params.get("mode")) ?? modes[0];
  const analyses = useQueries({
    queries: modes.map((mode) => {
      const worstCase =
        product.productType === "SINGLE_CHOICE_BUNDLE" &&
        mode.allocationType === "CHOICE_ALLOCATION";
      const configuration = {
        purchaseModeCode: mode.code,
        choiceCode: choiceCode || null,
        allocations: [],
        ingredients: product.ingredientOptions
          .filter((option) => option.active)
          .map((option) => ({
            ingredientCode: option.code,
            quantity: option.defaultQuantity,
          })),
      };
      return {
        staleTime: 30_000,
        queryKey: [
          "catalog-products",
          product.id,
          "pricing-analysis",
          worstCase ? mode.code : configuration,
        ],
        queryFn: () =>
          worstCase
            ? analyzeWorstCasePricing({
                productId: product.id!,
                purchaseModeCode: mode.code,
              })
            : analyzeProductPricing({ productId: product.id!, configuration }),
      };
    }),
  });
  const active =
    analyses[modes.findIndex((mode) => mode.code === selected?.code)];
  const result = active?.data;
  const worstCase =
    selected?.allocationType === "CHOICE_ALLOCATION" &&
    product.productType === "SINGLE_CHOICE_BUNDLE";
  const selectMode = (code: string) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("mode", code);
      return next;
    });
  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-5 pb-6">
      <ProductAnalysisHeader
        product={product}
        returnTo={returnTo}
        modes={modes}
        choices={choices}
        modeCode={selected?.code ?? ""}
        choiceCode={choiceCode}
        worstCase={worstCase}
        onModeChange={selectMode}
        onChoiceChange={setChoice}
      />
      {!modes.length && (
        <p>
          Aucun mode de vente actif. Configurez un mode dans le produit pour
          lancer l’analyse.
        </p>
      )}
      {active?.isPending && (
        <div role="status" className="flex items-center gap-2">
          <Spinner />
          Chargement de l’analyse…
        </div>
      )}
      {active?.isError && (
        <ApiErrorAlert
          title="Impossible de calculer l’analyse."
          error={active.error}
        >
          <Button onClick={() => void active.refetch()}>Réessayer</Button>
        </ApiErrorAlert>
      )}
      {result && <ProductFinancialOverview result={result} />}
      {boms.isError ? (
        <ApiErrorAlert
          title="Impossible de charger les noms des compositions."
          error={boms.error}
        >
          <Button onClick={() => void boms.refetch()}>Réessayer</Button>
        </ApiErrorAlert>
      ) : boms.isPending ? (
        <p role="status">Chargement des compositions…</p>
      ) : (
        <ProductCompositionDetails
          product={product}
          boms={boms.data}
          choiceCode={choiceCode}
          worstCase={worstCase}
        />
      )}
      <ProductModeComparison
        modes={modes}
        analyses={analyses}
        selected={selected}
        onSelect={selectMode}
      />
      {selected && !worstCase && choices.length > 1 && (
        <ProductChoiceComparison
          key={selected.code}
          product={product}
          mode={selected}
        />
      )}
      {result && <ProductCostQuality result={result} boms={boms.data} />}
    </div>
  );
}
