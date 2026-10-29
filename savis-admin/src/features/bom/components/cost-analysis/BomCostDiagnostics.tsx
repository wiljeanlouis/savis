import { Badge } from "@/shared/ui/badge";
import { costActivityLabel } from "../../model/bomCostPresentation";
import type { BomCostDiagnostic } from "../../types";

export function BomCostDiagnostics({
  diagnostics,
  complete,
}: {
  diagnostics: BomCostDiagnostic[];
  complete: boolean;
}) {
  if (diagnostics.length === 0 && complete) return null;
  return (
    <section
      aria-label="Diagnostics de coût"
      className="space-y-3 rounded-lg border border-amber-600/30 bg-amber-500/5 p-4"
    >
      <h3 className="text-sm font-medium">
        {complete ? "Points à vérifier" : "Pourquoi le coût est incomplet"}
      </h3>
      {!complete && (
        <p className="text-sm">
          Le sous-total couvre uniquement les coûts connus. Un coût manquant
          n’est pas un coût nul.
        </p>
      )}
      <ul className="space-y-3 text-sm">
        {diagnostics.map((issue) => (
          <li key={JSON.stringify(issue)} className="space-y-1">
            <p>
              <Badge variant="outline">
                {issue.blocking ? "Bloquant" : "À vérifier"}
              </Badge>{" "}
              <strong>{costActivityLabel(issue.source)}</strong>
            </p>
            <p className="break-words">{issue.message}</p>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">
                Référence du diagnostic
              </summary>
              <p className="mt-1 break-all">
                {issue.code} · {issue.source}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
