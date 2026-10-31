import { Badge } from "@/shared/ui/badge";
import { CardContent } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import type { ProductPricingAnalysis } from "../types";

const money = (amount?: number | null) =>
  amount == null
    ? "—"
    : new Intl.NumberFormat("fr-CA", {
        style: "currency",
        currency: "CAD",
      }).format(amount);

export function CatalogPricingSummary({
  result,
}: {
  result: ProductPricingAnalysis;
}) {
  return (
    <>
      <Separator />
      <CardContent className="space-y-3 py-4">
        <Badge variant={result.complete ? "secondary" : "destructive"}>
          {result.complete ? "Coût complet" : "Coût incomplet"}
        </Badge>
        {result.complete && (
          <Badge variant={result.status === "LOSS" ? "destructive" : "outline"}>
            {
              {
                GOOD: "Marge cible atteinte",
                REVIEW: "Prix à revoir",
                LOSS: "Vente à perte",
                INCOMPLETE: "Analyse incomplète",
              }[result.status]
            }
          </Badge>
        )}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric
            label="Analyse"
            value={
              result.analysisType === "WORST_CASE"
                ? "Pire cas"
                : "Configuration"
            }
          />
          <Metric
            label="Sous-total connu"
            value={money(result.knownSubtotal.amount)}
          />
          <Metric
            label="Coût unitaire"
            value={
              result.complete ? money(result.unitCost?.amount) : "Incomplet"
            }
          />
          <Metric
            label="Marge"
            value={
              result.complete && result.actualMarginRate != null
                ? `${(result.actualMarginRate * 100).toFixed(1)} %`
                : "Incomplète"
            }
          />
          <Metric
            label="Prix recommandé"
            value={
              result.complete
                ? money(result.recommendedPrice?.amount)
                : "Indisponible"
            }
          />
        </dl>
        {result.diagnostics.length > 0 && (
          <ul
            aria-label="Diagnostics de coût"
            className="list-disc pl-5 text-sm"
          >
            {result.diagnostics.map((issue) => (
              <li key={JSON.stringify(issue)}>
                {issue.source} : {issue.message}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
