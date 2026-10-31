import { cn } from "@/shared/lib/utils";
import {
  formatBomMoney,
  type BomCostCategory,
} from "../../model/bomCostPresentation";
import type { BomPrice } from "../../types";

const percent = new Intl.NumberFormat("fr-CA", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function BomCostBreakdown({
  categories,
  knownSubtotal,
  complete,
}: {
  categories: BomCostCategory[];
  knownSubtotal: BomPrice;
  complete: boolean;
}) {
  const canDistribute =
    Number.isFinite(knownSubtotal.amount) && knownSubtotal.amount > 0;
  const shares = categories.map((category) => ({
    ...category,
    share:
      canDistribute && Number.isFinite(category.subtotal.amount)
        ? Math.max(
            0,
            Math.min(1, category.subtotal.amount / knownSubtotal.amount),
          )
        : null,
  }));

  return (
    <section
      aria-label="Répartition des coûts"
      className="space-y-3 border-t pt-4"
    >
      <h3 className="text-xs font-medium">Répartition des coûts</h3>
      <div
        aria-hidden="true"
        className="flex h-2 overflow-hidden rounded-full bg-muted"
      >
        {shares.map(({ id, color, share }) => (
          <div
            key={id}
            className={cn("h-full", color)}
            style={{ width: `${(share ?? 0) * 100}%` }}
          />
        ))}
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {shares.map(({ id, label, subtotal, color, share }) => (
          <div
            key={id}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs"
          >
            <dt className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", color)}
              />
              {label}
            </dt>
            <dd className="tabular-nums">
              {formatBomMoney(subtotal)}{" "}
              <span className="ml-2 text-muted-foreground">
                {share == null ? "—" : percent.format(share)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      {!canDistribute && (
        <p className="text-xs text-muted-foreground">
          Aucun coût connu à répartir.
        </p>
      )}
      {!complete && (
        <p className="text-xs text-muted-foreground">
          Les proportions concernent uniquement les coûts connus.
        </p>
      )}
    </section>
  );
}
