import type { Bom } from "../types";
import { formatBomMoney } from "../model/bomCostPresentation";
import { BomCostOverview } from "./cost-analysis/BomCostOverview";
export function BomCostSummary({ bom }: { bom: Bom }) {
  const costing = bom.costing;
  const blocking =
    costing?.diagnostics.filter((issue) => issue.blocking).length ?? 0;
  return (
    <section aria-label="Coût de revient" className="space-y-3 border-t pt-3">
      <h3 className="text-sm font-semibold">Coût de revient</h3>
      {costing ? (
        <>
          <BomCostOverview costing={costing} yieldUnit={bom.yield.unit} />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Sous-total connu · composants</dt>
              <dd>{formatBomMoney(costing.componentSubtotal)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Sous-total connu · activités</dt>
              <dd>{formatBomMoney(costing.activitySubtotal)}</dd>
            </div>
          </dl>
          <p className="text-sm">
            {blocking} diagnostic{blocking > 1 ? "s" : ""} bloquant
            {blocking > 1 ? "s" : ""}
          </p>
          {costing.diagnostics.map((issue) => (
            <p
              key={`${issue.code}-${issue.source}-${issue.message}`}
              className="text-xs text-muted-foreground"
            >
              {issue.blocking ? "Bloquant" : "Avertissement"} · {issue.message}
            </p>
          ))}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Coût non évalué</p>
      )}
    </section>
  );
}
