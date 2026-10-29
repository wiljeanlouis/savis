import { EditorSection } from "@/shared/components/EditorSection";
import { Badge } from "@/shared/ui/badge";
import {
  formatBomMoney,
  formatBomQuantity,
} from "../model/bomCostPresentation";
import type { BomCosting } from "../types";
import { BomCostDiagnostics } from "./cost-analysis/BomCostDiagnostics";
import { BomCostGroup } from "./cost-analysis/BomCostGroup";

export function BomCostAnalysis({
  costing,
  yieldUnit,
}: {
  costing?: BomCosting | null;
  yieldUnit: string;
}) {
  const unitAmount =
    costing?.complete &&
    costing.totalCost &&
    Number.isFinite(costing.yieldQuantity) &&
    costing.yieldQuantity > 0
      ? costing.totalCost.amount / costing.yieldQuantity
      : null;
  const unitCost =
    unitAmount != null && Number.isFinite(unitAmount) && costing?.totalCost
      ? { ...costing.totalCost, amount: unitAmount }
      : null;

  return (
    <EditorSection
      id="bom-cost"
      title="Analyse des coûts"
      description="Coûts de la version enregistrée. Enregistrez vos modifications pour les actualiser."
    >
      {!costing ? (
        <p className="text-sm text-muted-foreground">Coût non évalué</p>
      ) : (
        <>
          <Badge variant="outline" className="self-start">
            {costing.complete ? "Coût complet" : "Coût incomplet"}
          </Badge>
          <dl
            aria-label="Synthèse des coûts"
            className="grid gap-4 rounded-lg bg-muted/40 p-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {costing.complete && (
              <Metric
                label="Coût total"
                value={formatBomMoney(costing.totalCost)}
              />
            )}
            <Metric
              label="Sous-total connu"
              value={formatBomMoney(costing.knownSubtotal)}
            />
            <Metric
              label="Rendement enregistré"
              value={formatBomQuantity(costing.yieldQuantity, yieldUnit)}
            />
            {unitCost && (
              <Metric
                label="Coût par unité produite"
                value={`${formatBomMoney(unitCost)} / ${yieldUnit}`}
              />
            )}
          </dl>
          <BomCostDiagnostics
            diagnostics={costing.diagnostics}
            complete={costing.complete}
          />
          <div className="min-w-0 space-y-4">
            <h3 className="text-sm font-medium">
              Répartition et détail des postes
            </h3>
            <BomCostGroup
              title="Composants"
              lines={costing.components}
              subtotal={costing.componentSubtotal}
            />
            <BomCostGroup
              title="Activités"
              lines={costing.activities}
              subtotal={costing.activitySubtotal}
              activities
            />
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              Les montants sont arrondis pour l’affichage. Le total est calculé
              avant cet arrondi : la somme des sous-totaux affichés peut donc
              différer de quelques cents.
            </p>
            <details>
              <summary className="cursor-pointer text-foreground">
                Précision des montants
              </summary>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <Metric
                  label="Composants (précision reçue)"
                  value={formatBomMoney(costing.componentSubtotal, true)}
                />
                <Metric
                  label="Activités (précision reçue)"
                  value={formatBomMoney(costing.activitySubtotal, true)}
                />
                <Metric
                  label="Sous-total connu (précision reçue)"
                  value={formatBomMoney(costing.knownSubtotal, true)}
                />
                {costing.complete && (
                  <Metric
                    label="Coût total (précision reçue)"
                    value={formatBomMoney(costing.totalCost, true)}
                  />
                )}
              </dl>
            </details>
          </div>
        </>
      )}
    </EditorSection>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground tabular-nums">
        {value}
      </dd>
    </div>
  );
}
