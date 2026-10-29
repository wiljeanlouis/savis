import { costActivityLabel } from "../../model/bomCostPresentation";
import type { BomCostDiagnostic } from "../../types";

export function BomCostDiagnostics({
  diagnostics,
  includeReferences = false,
}: {
  diagnostics: BomCostDiagnostic[];
  includeReferences?: boolean;
}) {
  if (diagnostics.length === 0) return null;
  return (
    <section
      aria-label="Diagnostics de coût"
      className="space-y-2 border-l-2 border-amber-600/40 pl-3 text-xs"
    >
      <h3 className="font-medium">Points à vérifier</h3>
      <ul className="space-y-2">
        {diagnostics.map((issue) => (
          <li key={JSON.stringify(issue)} className="break-words">
            <span className="font-medium">
              {costActivityLabel(issue.source)}
            </span>{" "}
            : {issue.message}
          </li>
        ))}
      </ul>
      {includeReferences && (
        <details className="text-muted-foreground">
          <summary className="cursor-pointer">
            Références des diagnostics
          </summary>
          <ul className="mt-2 space-y-1 break-words [overflow-wrap:anywhere]">
            {diagnostics.map((issue) => (
              <li key={JSON.stringify(issue)}>
                {issue.code} · {issue.source} ·{" "}
                {issue.blocking ? "Bloquant" : "Non bloquant"}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
