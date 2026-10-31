import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import type { ProductPricingAnalysis } from "../../types";
import {
  monetaryMargin,
  money,
  percent,
  pricingStatusLabels,
} from "./pricingPresentation";

export function ProductFinancialOverview({
  result,
}: {
  result: ProductPricingAnalysis;
}) {
  const margin = monetaryMargin(result);
  const tone = !margin
    ? ""
    : result.status === "LOSS"
      ? "text-destructive"
      : result.status === "GOOD"
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-amber-700 dark:text-amber-400";
  const metrics = [
    {
      label: "Prix de vente",
      value: money(result.salePrice),
      hint: `${result.analyzedQuantity} unité(s) analysée(s)`,
      highlight: false,
    },
    {
      label: "Coût de revient estimé",
      value: result.complete ? money(result.cost) : "Coût incomplet",
      hint: result.complete
        ? "Coût du mode sélectionné"
        : `Sous-total connu : ${money(result.knownSubtotal)}`,
      highlight: false,
    },
    {
      label: "Marge estimée",
      value: money(margin),
      hint: "Prix de vente − coût estimé",
      highlight: true,
    },
    {
      label: "Marge sur vente",
      value: percent(margin ? result.actualMarginRate : null),
      hint: `Objectif : ${percent(result.targetMarginRate)}`,
      highlight: true,
    },
  ];
  const chart =
    margin &&
    result.cost &&
    result.salePrice?.amount > 0 &&
    margin.amount >= 0 &&
    result.cost.amount >= 0;
  return (
    <div className="space-y-4">
      <section aria-label="Synthèse financière" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Synthèse financière</h2>
          <a
            href="#calculation-quality"
            className="flex flex-wrap items-center gap-2 rounded-sm text-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Badge variant={result.complete ? "secondary" : "destructive"}>
              {result.complete ? "Coût complet" : "Coût incomplet"}
            </Badge>
            <span>
              Voir la qualité du calcul
              {result.diagnostics.length > 0
                ? ` · ${result.diagnostics.length} diagnostic(s)`
                : ""}
            </span>
          </a>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card
              key={metric.label}
              className={`gap-0 py-3 shadow-none ${metric.highlight && margin ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <CardContent className="space-y-1 px-4">
                <dt className="text-xs text-muted-foreground">
                  {metric.label}
                </dt>
                <dd
                  className={`text-xl font-semibold tracking-tight [overflow-wrap:anywhere] tabular-nums ${metric.highlight ? tone : ""}`}
                >
                  {metric.value}
                </dd>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {metric.hint}
                </p>
              </CardContent>
            </Card>
          ))}
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
          <p className={tone}>
            {result.complete
              ? pricingStatusLabels[result.status]
              : "Marge non déterminable : le calcul est incomplet."}
          </p>
          <dl className="flex flex-wrap gap-x-5 gap-y-2">
            <div>
              <dt className="text-xs text-muted-foreground">
                Objectif de marge sur vente
              </dt>
              <dd className="font-medium tabular-nums">
                {percent(result.targetMarginRate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Prix recommandé</dt>
              <dd className="font-medium tabular-nums">
                {result.complete
                  ? money(result.recommendedPrice)
                  : "Non déterminable"}
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <section
        className="space-y-3 rounded-xl border p-4"
        aria-label="Répartition des coûts"
      >
        <div>
          <h2 className="text-sm font-semibold">Répartition des coûts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Contribution du coût estimé et de la marge au prix de vente.
          </p>
        </div>
        {chart && result.cost && margin ? (
          <>
            <div
              className="flex h-6 overflow-hidden rounded-md bg-muted"
              role="img"
              aria-label={`Coût : ${money(result.cost)} ; marge : ${money(margin)}`}
            >
              <div
                className="bg-primary"
                style={{
                  width: `${(result.cost.amount / result.salePrice.amount) * 100}%`,
                }}
              />
              <div
                className="bg-emerald-600 dark:bg-emerald-400"
                style={{
                  width: `${(margin.amount / result.salePrice.amount) * 100}%`,
                }}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-start gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="mt-1 size-2.5 shrink-0 rounded-sm bg-primary"
                />
                <div>
                  <p className="text-xs text-muted-foreground">Coût estimé</p>
                  <p className="font-medium tabular-nums">
                    {money(result.cost)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      · {percent(result.cost.amount / result.salePrice.amount)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="mt-1 size-2.5 shrink-0 rounded-sm bg-emerald-600 dark:bg-emerald-400"
                />
                <div>
                  <p className="text-xs text-muted-foreground">Marge estimée</p>
                  <p className="font-medium tabular-nums">
                    {money(margin)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      · {percent(result.actualMarginRate)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p
            className={`rounded-lg bg-muted/50 p-3 text-sm leading-relaxed ${margin && margin.amount < 0 ? "text-destructive" : "text-muted-foreground"}`}
          >
            {margin && margin.amount < 0
              ? `Vente à perte : coût ${money(result.cost)}, prix ${money(result.salePrice)}, marge ${money(margin)}.`
              : `Répartition non déterminable. Sous-total connu : ${money(result.knownSubtotal)}.${!result.complete ? " Ce montant ne représente pas un coût complet." : " Les montants ne permettent pas une représentation proportionnelle."}`}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Marge sur vente (%) = (prix − coût) / prix. La ventilation par
          catégorie de coût n’est pas disponible.
        </p>
      </section>
    </div>
  );
}
