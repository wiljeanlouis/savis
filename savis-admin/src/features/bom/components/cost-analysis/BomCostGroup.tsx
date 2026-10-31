import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { TableBody, TableCell, TableHead, TableRow } from "@/shared/ui/table";
import {
  costActivityLabel,
  costLineIssue,
  formatBomMoney,
  formatBomQuantity,
  type BomCostCategory,
} from "../../model/bomCostPresentation";
import type { BomCostLine } from "../../types";

export function BomCostGroup({
  category,
  onInspect,
  selectedLine,
  dialogId,
}: {
  category: BomCostCategory;
  onInspect: (
    line: BomCostLine,
    label: string,
    trigger: HTMLButtonElement,
  ) => void;
  selectedLine?: BomCostLine;
  dialogId: string;
}) {
  const occurrences = new Map<string, number>();
  const rows = category.lines.map((line) => {
    const identity = JSON.stringify(line);
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);
    return { line, key: `${identity}-${occurrence}` };
  });

  return (
    <TableBody aria-label={category.label}>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableHead scope="rowgroup" colSpan={2} className="h-9">
          {category.label}{" "}
          <span className="ml-1 font-normal text-muted-foreground">
            · sous-total connu
          </span>
        </TableHead>
        <TableCell className="text-right font-medium tabular-nums">
          {formatBomMoney(category.subtotal)}
        </TableCell>
      </TableRow>
      {rows.map(({ line, key }) => {
        const label = category.activities
          ? costActivityLabel(line.label)
          : line.label;
        const issue = costLineIssue(line);
        return (
          <TableRow key={key}>
            <TableCell className="max-w-0 whitespace-normal">
              <Button
                type="button"
                variant="link"
                className="h-auto max-w-full justify-start px-0 py-1 text-left whitespace-normal"
                aria-label={`Détails du poste : ${label}`}
                aria-haspopup="dialog"
                aria-expanded={selectedLine === line}
                aria-controls={dialogId}
                onClick={(event) => onInspect(line, label, event.currentTarget)}
              >
                {label}
              </Button>
              {issue && (
                <div>
                  <Badge
                    variant="outline"
                    className="max-w-full border-amber-600/30 text-left whitespace-normal text-amber-800 dark:text-amber-300"
                  >
                    {issue}
                  </Badge>
                </div>
              )}
            </TableCell>
            <TableCell className="whitespace-normal text-muted-foreground">
              {formatBomQuantity(line.quantity, line.unit)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {line.status === "KNOWN" ? (
                formatBomMoney(line.amount)
              ) : line.status === "NOT_APPLICABLE" ? (
                <span className="text-muted-foreground">Sans objet</span>
              ) : (
                <span aria-label="Coût inconnu">—</span>
              )}
            </TableCell>
          </TableRow>
        );
      })}
      {rows.length === 0 && (
        <TableRow>
          <TableCell colSpan={3} className="text-muted-foreground">
            Aucun poste.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}
