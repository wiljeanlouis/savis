import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
import type { ProductPurchaseMode, ProductPricingAnalysis } from "../../types";
import { money, percent, monetaryMargin } from "./pricingPresentation";

export function ProductModeComparison({
  modes,
  analyses,
  selected,
  onSelect,
  title = "Comparaison des modes de vente",
  description = "Chaque mode conserve ses règles de coût. Les formats composables sont évalués au pire cas ; les autres modes utilisent le choix sélectionné.",
  modeLabel = "Mode de vente",
}: {
  title?: string;
  description?: string;
  modeLabel?: string;
  modes: ProductPurchaseMode[];
  analyses: UseQueryResult<ProductPricingAnalysis, Error>[];
  selected?: ProductPurchaseMode;
  onSelect?: (code: string) => void;
}) {
  if (!modes.length) return null;
  return (
    <section className="min-w-0 space-y-3 rounded-xl border p-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <Table aria-label={title} className="block w-full md:table">
        <TableHeader className="sr-only md:not-sr-only md:table-header-group">
          <TableRow>
            {[
              modeLabel,
              "Quantité",
              "Prix de vente",
              "Coût estimé",
              "Marge estimée",
              "Marge sur vente (%)",
              "Qualité du calcul",
            ].map((label, index) => (
              <TableHead
                key={label}
                scope="col"
                className={`${index > 0 && index < 6 ? "text-right" : ""} px-2 text-xs whitespace-normal`}
              >
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="block md:table-row-group">
          {modes.map((mode, index) => {
            const query = analyses[index];
            const data = query.data;
            const margin = data ? monetaryMargin(data) : null;
            return (
              <TableRow
                key={mode.code}
                data-selected={mode.code === selected?.code}
                className="grid grid-cols-2 gap-x-3 gap-y-1 py-3 data-[selected=true]:bg-primary/10 md:table-row md:py-0"
              >
                <TableCell className="col-span-2 block px-2 py-1 whitespace-normal md:table-cell md:py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {onSelect ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Analyser le mode ${mode.label}`}
                        aria-pressed={mode.code === selected?.code}
                        className="h-auto max-w-full justify-start px-0 py-1 text-left whitespace-normal"
                        onClick={() => onSelect(mode.code)}
                      >
                        {mode.label}
                      </Button>
                    ) : (
                      <span className="font-medium">{mode.label}</span>
                    )}
                    {mode.code === selected?.code && (
                      <Badge variant="outline" className="text-[10px]">
                        Sélectionné
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <ComparisonCell label="Quantité">
                  {mode.quantity} unité(s)
                </ComparisonCell>
                {query.isPending ? (
                  <TableCell
                    colSpan={5}
                    className="col-span-2 whitespace-normal"
                  >
                    <p role="status">Chargement de l’analyse…</p>
                  </TableCell>
                ) : query.isError ? (
                  <TableCell
                    colSpan={5}
                    className="col-span-2 whitespace-normal"
                  >
                    <ApiErrorAlert
                      title="Analyse indisponible."
                      error={query.error}
                    >
                      <Button onClick={() => void query.refetch()}>
                        Réessayer
                      </Button>
                    </ApiErrorAlert>
                  </TableCell>
                ) : (
                  <>
                    <ComparisonCell label="Prix de vente">
                      {money(data?.salePrice)}
                    </ComparisonCell>
                    <ComparisonCell label="Coût estimé">
                      {data && !data.complete
                        ? "Coût incomplet"
                        : money(data?.cost)}
                    </ComparisonCell>
                    <ComparisonCell
                      label="Marge estimée"
                      loss={margin != null && margin.amount < 0}
                    >
                      {money(margin)}
                    </ComparisonCell>
                    <ComparisonCell
                      label="Marge sur vente (%)"
                      loss={margin != null && margin.amount < 0}
                    >
                      {percent(margin ? data?.actualMarginRate : null)}
                    </ComparisonCell>
                    <TableCell className="col-span-2 block px-2 py-1 whitespace-normal md:table-cell md:py-3">
                      <span className="mb-1 block text-[11px] text-muted-foreground md:hidden">
                        Qualité du calcul
                      </span>
                      {data ? (
                        <>
                          <Badge
                            variant={
                              data.complete ? "secondary" : "destructive"
                            }
                          >
                            {data.complete ? "Coût complet" : "Coût incomplet"}
                          </Badge>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {data.analysisType === "WORST_CASE"
                              ? "Estimation conservatrice · pire cas"
                              : "Configuration sélectionnée"}
                          </p>
                        </>
                      ) : (
                        "Non déterminable"
                      )}
                    </TableCell>
                  </>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
function ComparisonCell({
  label,
  loss,
  children,
}: {
  label: string;
  loss?: boolean;
  children: ReactNode;
}) {
  return (
    <TableCell
      className={`block px-2 py-1 whitespace-normal tabular-nums md:table-cell md:py-3 md:text-right ${loss ? "text-destructive" : ""}`}
    >
      <span className="mb-0.5 block text-[11px] text-muted-foreground md:hidden">
        {label}
      </span>
      <span className="font-medium">{children}</span>
    </TableCell>
  );
}
