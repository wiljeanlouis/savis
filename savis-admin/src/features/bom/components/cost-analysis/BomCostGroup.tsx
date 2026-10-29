import { Badge } from "@/shared/ui/badge";
import {
  costActivityLabel,
  formatBomMoney,
  formatBomQuantity,
} from "../../model/bomCostPresentation";
import type { BomCostLine, BomPrice } from "../../types";
import { BomCostProvenance } from "./BomCostProvenance";

export function BomCostGroup({
  title,
  lines,
  subtotal,
  activities = false,
}: {
  title: string;
  lines: BomCostLine[];
  subtotal: BomPrice;
  activities?: boolean;
}) {
  // Identical activities are valid; keep their keys distinct without using array positions.
  const occurrences = new Map<string, number>();
  const rows = lines.map((line) => {
    const identity = JSON.stringify(line);
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);
    return { line, key: `${identity}-${occurrence}` };
  });

  return (
    <section aria-label={title} className="min-w-0 rounded-lg border">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b bg-muted/40 px-4 py-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">
          Sous-total connu :{" "}
          <strong className="text-foreground tabular-nums">
            {formatBomMoney(subtotal)}
          </strong>
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Aucun poste.</p>
      ) : (
        <ul className="divide-y">
          {rows.map(({ line, key }) => {
            const label = activities
              ? costActivityLabel(line.label)
              : line.label;
            return (
              <li
                key={key}
                className="grid min-w-0 gap-3 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
              >
                <div className="min-w-0 space-y-2">
                  <p className="text-sm font-medium break-words">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBomQuantity(line.quantity, line.unit)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm tabular-nums">
                      {line.status === "KNOWN"
                        ? formatBomMoney(line.amount)
                        : "—"}
                    </strong>
                    <Badge variant="outline">
                      {line.status === "MISSING"
                        ? "Coût manquant"
                        : line.status === "NOT_APPLICABLE"
                          ? "Sans objet"
                          : line.amount?.amount === 0
                            ? "Coût connu · nul"
                            : "Coût connu"}
                    </Badge>
                  </div>
                </div>
                <BomCostProvenance line={line} label={label} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
