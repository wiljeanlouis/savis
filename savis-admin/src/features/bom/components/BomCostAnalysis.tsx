import { EditorSection } from "@/shared/components/EditorSection";
import { bomCostCategories } from "../model/bomCostPresentation";
import type { BomCosting } from "../types";
import { BomCostDiagnostics } from "./cost-analysis/BomCostDiagnostics";
import { BomCostBreakdown } from "./cost-analysis/BomCostBreakdown";
import { BomCostOverview } from "./cost-analysis/BomCostOverview";
import { BomCostTable } from "./cost-analysis/BomCostTable";

export function BomCostAnalysis({
  costing,
  yieldUnit,
}: {
  costing?: BomCosting | null;
  yieldUnit: string;
}) {
  const categories = costing ? bomCostCategories(costing) : [];
  const lineDiagnostics = new Set(
    categories.flatMap(({ lines }) =>
      lines.flatMap((line) =>
        line.diagnostics.map((issue) => JSON.stringify(issue)),
      ),
    ),
  );
  const generalDiagnostics =
    costing?.diagnostics.filter(
      (issue) => !lineDiagnostics.has(JSON.stringify(issue)),
    ) ?? [];

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
          <BomCostOverview costing={costing} yieldUnit={yieldUnit} />
          <BomCostBreakdown
            categories={categories}
            knownSubtotal={costing.knownSubtotal}
            complete={costing.complete}
          />
          <BomCostTable categories={categories} />
          <BomCostDiagnostics
            diagnostics={generalDiagnostics}
            includeReferences
          />
          <p className="text-xs text-muted-foreground">
            Les montants sont arrondis pour l'affichage. De légers écarts
            peuvent apparaître entre les sous-totaux et le total.
          </p>
        </>
      )}
    </EditorSection>
  );
}
