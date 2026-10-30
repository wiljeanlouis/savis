import type { Bom } from "../types";
import { formatBomMoney } from "../model/bomCostPresentation";
import { BomCostOverview } from "./cost-analysis/BomCostOverview";
export function BomCostSummary({ bom }: { bom: Bom }) {
  const costing = bom.costing;
  const blocking =
    costing?.diagnostics.filter((issue) => issue.blocking).length ?? 0;
  const warnings =
    costing?.diagnostics.filter((issue) => !issue.blocking) ?? [];
  return (
    <section aria-label="Coût de revient" className="space-y-3 border-b pb-4">
      <h3 className="text-base font-semibold">Coût de revient</h3>
      {costing ? (
        <>
          <BomCostOverview
            costing={costing}
            yieldUnit={bom.yield.unit}
            showYield={false}
          />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2 text-muted-foreground">
              <dt>composants</dt>
              <dd className="text-foreground">
                {formatBomMoney(costing.componentSubtotal)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <dt>activités</dt>
              <dd className="text-foreground">
                {formatBomMoney(costing.activitySubtotal)}
              </dd>
            </div>
          </dl>
          <p
            className={`text-sm font-medium ${blocking ? "text-red-700 dark:text-red-400" : "text-muted-foreground"}`}
          >
            {blocking} diagnostic{blocking > 1 ? "s" : ""} bloquant
            {blocking > 1 ? "s" : ""}
          </p>
          {costing.diagnostics.some((issue) => issue.blocking) && (
            <ul className="space-y-1 text-sm text-red-700 dark:text-red-400">
              {costing.diagnostics
                .filter((issue) => issue.blocking)
                .map((issue) => (
                  <li key={`${issue.code}-${issue.source}-${issue.message}`}>
                    Bloquant · {issue.message}
                  </li>
                ))}
            </ul>
          )}
          {warnings.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer rounded-sm py-1 text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary">
                {warnings.length} avertissement
                {warnings.length > 1 ? "s" : ""} non bloquant
                {warnings.length > 1 ? "s" : ""}
              </summary>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {warnings.map((issue) => (
                  <li key={`${issue.code}-${issue.source}-${issue.message}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Coût non évalué</p>
      )}
    </section>
  );
}
