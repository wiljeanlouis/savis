import { Link } from "react-router";
import { Badge } from "@/shared/ui/badge";
import type { Bom } from "@/features/bom/types";
import type { ProductPricingAnalysis } from "../../types";

export function ProductCostQuality({
  result,
  boms,
}: {
  result: ProductPricingAnalysis;
  boms?: Bom[];
}) {
  const names = new Map(boms?.map((bom) => [bom.id, bom.name]));
  const composition = (id: string, missing = false) => {
    const name = names.get(id);
    if (missing || (boms !== undefined && name === undefined))
      return (
        <p className="mb-1 font-medium">
          Composition introuvable
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {id}
          </span>
        </p>
      );
    return (
      <Link className="mb-1 block font-medium underline" to={`/boms/${id}`}>
        {name
          ? `${result.missingBomIds.includes(id) ? "Composition incomplète" : "Composition"} : ${name}`
          : `Nom de composition indisponible · ${id}`}
      </Link>
    );
  };
  return (
    <section
      id="calculation-quality"
      className="scroll-mt-4 space-y-3 rounded-xl border p-4"
    >
      <h2 className="text-sm font-semibold">Qualité du calcul</h2>
      <Badge variant={result.complete ? "secondary" : "destructive"}>
        {result.complete ? "Coût complet" : "Coût incomplet"}
      </Badge>
      <p className="text-sm text-muted-foreground">
        {result.complete
          ? "Calcul complet dans le périmètre des composants et activités pris en charge."
          : "La marge et le prix recommandé ne peuvent pas être établis de manière fiable."}
      </p>
      {result.diagnostics.length > 0 ? (
        <ul className="space-y-2" aria-label="Diagnostics de coût">
          {result.diagnostics.map((issue) => (
            <li
              key={JSON.stringify(issue)}
              className="rounded-lg bg-muted/50 p-3 text-sm"
            >
              {issue.bomId &&
                composition(issue.bomId, issue.code === "BOM_NOT_FOUND")}
              <Badge variant={issue.blocking ? "destructive" : "outline"}>
                {issue.blocking ? "Bloquant" : "Avertissement"}
              </Badge>{" "}
              <span className="font-medium">{issue.source}</span> :{" "}
              {issue.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">Aucun diagnostic signalé.</p>
      )}
      {result.missingBomIds.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm">
          {result.missingBomIds
            .filter(
              (id) => !result.diagnostics.some((issue) => issue.bomId === id),
            )
            .map((id) => (
              <div key={id}>{composition(id)}</div>
            ))}
        </div>
      )}
    </section>
  );
}
