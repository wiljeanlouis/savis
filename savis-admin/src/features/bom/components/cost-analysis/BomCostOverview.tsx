import { Badge } from "@/shared/ui/badge";
import {
  formatBomMoney,
  formatBomQuantity,
} from "../../model/bomCostPresentation";
import type { BomCosting } from "../../types";

export function BomCostOverview({
  costing,
  yieldUnit,
}: {
  costing: BomCosting;
  yieldUnit: string;
}) {
  const validYield =
    Number.isFinite(costing.yieldQuantity) && costing.yieldQuantity > 0;
  const unitAmount =
    costing.complete && costing.totalCost && validYield
      ? costing.totalCost.amount / costing.yieldQuantity
      : null;
  const unitCost =
    unitAmount != null && Number.isFinite(unitAmount) && costing.totalCost
      ? { ...costing.totalCost, amount: unitAmount }
      : null;

  return (
    <section aria-label="Synthèse des coûts" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <dl className="grid flex-1 gap-5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <dt className="text-xs text-muted-foreground">
              {costing.complete ? "Coût total" : "Sous-total connu"}
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
              {formatBomMoney(
                costing.complete ? costing.totalCost : costing.knownSubtotal,
              )}
            </dd>
          </div>
          {unitCost && (
            <div>
              <dt className="text-xs text-muted-foreground">
                Coût par unité produite
              </dt>
              <dd className="mt-2 text-sm font-medium tabular-nums">
                {formatBomMoney(unitCost)} / {yieldUnit}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted-foreground">
              Rendement enregistré
            </dt>
            <dd className="mt-2 text-sm font-medium">
              {validYield
                ? formatBomQuantity(costing.yieldQuantity, yieldUnit)
                : "Rendement invalide"}
            </dd>
          </div>
        </dl>
        <Badge
          variant="outline"
          className={
            costing.complete
              ? "text-muted-foreground"
              : "border-amber-600/40 text-amber-800 dark:text-amber-300"
          }
        >
          {costing.complete ? "Coût complet" : "Coût incomplet"}
        </Badge>
      </div>
      {!costing.complete && (
        <p className="text-xs text-muted-foreground">
          Le sous-total couvre uniquement les coûts connus. Un coût manquant
          n’est pas un coût nul.
        </p>
      )}
    </section>
  );
}
