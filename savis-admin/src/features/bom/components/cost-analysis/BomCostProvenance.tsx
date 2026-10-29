import {
  formatBomMoney,
  formatBomQuantity,
} from "../../model/bomCostPresentation";
import type { BomCostLine } from "../../types";

export function BomCostProvenance({
  line,
  label,
}: {
  line: BomCostLine;
  label: string;
}) {
  const { source, hourlyRate } = line;
  const origin = hourlyRate
    ? `Taux horaire configuré : ${formatBomMoney(hourlyRate)}/h`
    : source?.usedOfferId
      ? source.selectedOfferId === source.usedOfferId
        ? "Offre sélectionnée"
        : "Offre compatible la moins chère"
      : "Origine non disponible";

  return (
    <div className="min-w-0 space-y-1 text-xs text-muted-foreground">
      <p>{origin}</p>
      {(source || hourlyRate) && (
        <details className="rounded-md border p-2">
          <summary className="cursor-pointer text-foreground">
            Provenance et détails — {label}
          </summary>
          <dl className="mt-3 grid gap-2 break-words [overflow-wrap:anywhere]">
            {line.amount && (
              <Entry
                label="Montant du poste (précision reçue)"
                value={formatBomMoney(line.amount, true)}
              />
            )}
            {hourlyRate && (
              <Entry
                label="Taux horaire (précision reçue)"
                value={`${formatBomMoney(hourlyRate, true)}/h`}
              />
            )}
            {source?.packagePrice && (
              <Entry
                label="Prix du conditionnement"
                value={formatBomMoney(source.packagePrice, true)}
              />
            )}
            {source?.packageQuantity != null && (
              <Entry
                label="Conditionnement"
                value={formatBomQuantity(
                  source.packageQuantity,
                  source.packageUnit ?? "",
                )}
              />
            )}
            {source?.selectedOfferId && (
              <Entry
                label="Identifiant de l’offre sélectionnée"
                value={source.selectedOfferId}
              />
            )}
            {source?.usedOfferId && (
              <Entry
                label="Identifiant de l’offre utilisée"
                value={source.usedOfferId}
              />
            )}
            {source?.observedAt && (
              <Entry
                label="Date d’observation reçue"
                value={source.observedAt}
              />
            )}
          </dl>
        </details>
      )}
    </div>
  );
}

function Entry({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}
