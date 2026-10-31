import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Link } from "react-router";
import type {
  MoneyValue,
  OrderRequirement,
  OrderRequirementReport,
} from "../types";
import { OrderProductImage } from "./OrderProductImage";

interface OrderRequirementReportCardProps {
  report?: OrderRequirementReport;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Displays aggregated production-component requirements and current sourcing data.
 */
export function OrderRequirementReportCard({
  report,
  isLoading,
  isError,
}: OrderRequirementReportCardProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Besoins de production</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Composants agrégés selon la commande et les compositions
              actuelles. Le stock disponible n’est pas déduit.
            </p>
          </div>
          {report ? (
            <Badge variant={report.complete ? "secondary" : "outline"}>
              {report.complete ? "Rapport complet" : "Rapport partiel"}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : isError ? (
          <p className="px-6 py-5 text-destructive">
            Impossible de générer le rapport de besoins.
          </p>
        ) : (
          <ReportContent report={report} />
        )}
      </CardContent>
    </Card>
  );
}

function ReportContent({ report }: { report?: OrderRequirementReport }) {
  return (
    <>
      {(report?.warnings.length ?? 0) > 0 ? (
        <ul className="mx-6 mt-4 list-disc space-y-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-8 py-3 text-sm text-amber-800 dark:text-amber-200">
          {report?.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {(report?.requirements.length ?? 0) === 0 ? (
        <p className="px-6 py-6 text-center text-muted-foreground">
          Aucun composant requis n’a été trouvé pour cette commande.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Composant</TableHead>
              <TableHead>Besoin</TableHead>
              <TableHead>Approvisionnement actuel</TableHead>
              <TableHead>Provenance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.requirements.map((requirement) => (
              <RequirementRow
                key={requirement.componentKey}
                requirement={requirement}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

function RequirementRow({ requirement }: { requirement: OrderRequirement }) {
  const sourcing = requirement.sourcingInformation;
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <OrderProductImage
            imageUrl={sourcing?.imageUrl}
            productName={sourcing?.productName ?? requirement.componentName}
            className="size-12"
          />
          <span className="font-medium capitalize">
            {requirement.componentName}
          </span>
        </div>
      </TableCell>
      <TableCell className="font-semibold tabular-nums">
        {formatQuantity(requirement.requiredQuantity, requirement.unit)}
      </TableCell>
      <TableCell>
        {sourcing ? (
          <div className="space-y-1">
            <p className="font-medium">
              {sourcing.productName ?? requirement.componentName}
            </p>
            <p className="text-sm text-muted-foreground">
              {[sourcing.brandOrLabel, sourcing.supplierName]
                .filter(Boolean)
                .join(" · ") || "Fournisseur non précisé"}
            </p>
            <p className="text-sm">
              {sourcing.packageSize != null && sourcing.packageUnit
                ? formatQuantity(sourcing.packageSize, sourcing.packageUnit)
                : "Format inconnu"}
              {sourcing.currentPrice
                ? ` · ${formatMoney(sourcing.currentPrice)}`
                : " · Prix inconnu"}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground">Non configuré</span>
        )}
      </TableCell>
      <TableCell>
        <details>
          <summary className="cursor-pointer text-sm font-medium">
            {requirement.sources.length} source
            {requirement.sources.length > 1 ? "s" : ""}
          </summary>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            {requirement.sources.map((source) => (
              <li
                key={`${source.orderItemId}-${source.bomId}-${source.configurationSource}-${source.quantityContribution}-${source.unit}`}
              >
                <span className="text-foreground">{source.productName}</span>
                {source.configurationSource
                  ? ` · ${source.configurationSource}`
                  : ""}
                {" · "}
                <Link
                  className="text-primary hover:underline"
                  to={`/boms/${source.bomId}`}
                >
                  {source.bomName}
                </Link>
                {" · "}
                {formatQuantity(source.quantityContribution, source.unit)}
              </li>
            ))}
          </ul>
        </details>
      </TableCell>
    </TableRow>
  );
}

function formatQuantity(value: number, unit: string) {
  const labels: Record<string, [string, string]> = {
    piece: ["pièce", "pièces"],
    portion: ["portion", "portions"],
  };
  const label = labels[unit]?.[value === 1 ? 0 : 1] ?? unit;
  return `${new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 4 }).format(value)} ${label}`;
}

function formatMoney(money: MoneyValue) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: money.currency,
  }).format(money.amount);
}
