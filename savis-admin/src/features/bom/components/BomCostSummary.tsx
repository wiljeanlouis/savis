import { Badge } from "@/shared/ui/badge";
import { formatBomMoney } from "../model/bomCostPresentation";
import type { BomCosting } from "../types";

/** Compact valuation for the composition list; traceability lives in the editor. */
export function BomCostSummary({ costing }: { costing?: BomCosting | null }) {
  if (!costing)
    return <p className="text-sm text-muted-foreground">Coût non évalué</p>;

  return (
    <div className="space-y-2 text-sm">
      <Badge
        variant="outline"
        className={
          costing.complete
            ? undefined
            : "border-amber-600/40 text-amber-800 dark:text-amber-300"
        }
      >
        {costing.complete ? "Coût complet" : "Coût incomplet"}
      </Badge>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-muted-foreground">
          {costing.complete ? "Coût total" : "Sous-total connu"}
        </span>
        <strong className="tabular-nums">
          {formatBomMoney(
            costing.complete ? costing.totalCost : costing.knownSubtotal,
          )}
        </strong>
      </p>
    </div>
  );
}
