import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import {
  formatBomMoney,
  formatBomQuantity,
} from "../../model/bomCostPresentation";
import type { BomCostLine } from "../../types";
import { BomCostDiagnostics } from "./BomCostDiagnostics";

export function BomCostProvenance({
  selected,
  dialogId,
  onClose,
  onRestoreFocus,
}: {
  selected: { line: BomCostLine; label: string } | null;
  dialogId: string;
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  const line = selected?.line;
  const source = line?.source;
  const origin = line?.hourlyRate
    ? "Taux horaire configuré"
    : source?.usedOfferId
      ? source.selectedOfferId === source.usedOfferId
        ? "Offre sélectionnée"
        : "Sélection automatique — offre compatible la moins chère"
      : "Origine non disponible";

  return (
    <Sheet
      open={Boolean(selected)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        id={dialogId}
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <SheetHeader>
          <SheetTitle>{selected?.label ?? "Détail du poste"}</SheetTitle>
          <SheetDescription>
            Provenance et calcul du coût de la version enregistrée.
          </SheetDescription>
        </SheetHeader>
        {line && (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-4">
            <dl className="grid grid-cols-2 gap-4">
              <Entry
                label="Quantité / durée"
                value={formatBomQuantity(line.quantity, line.unit)}
              />
              <Entry
                label="Coût"
                value={
                  line.status === "KNOWN"
                    ? formatBomMoney(line.amount)
                    : line.status === "NOT_APPLICABLE"
                      ? "Sans objet"
                      : "Coût manquant"
                }
              />
              <Entry label="Source du coût" value={origin} />
              {line.hourlyRate && (
                <Entry
                  label="Taux horaire utilisé"
                  value={`${formatBomMoney(line.hourlyRate)}/h`}
                />
              )}
              {source?.packagePrice && (
                <Entry
                  label="Prix du conditionnement"
                  value={formatBomMoney(source.packagePrice)}
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
            </dl>
            <BomCostDiagnostics diagnostics={line.diagnostics} />
            <details className="border-t pt-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer">
                Informations techniques
              </summary>
              <dl className="mt-4 grid gap-3 break-words [overflow-wrap:anywhere]">
                <Entry label="Statut du poste" value={line.status} />
                {line.amount && (
                  <Entry
                    label="Montant du poste (précision reçue)"
                    value={formatBomMoney(line.amount, true)}
                  />
                )}
                {line.hourlyRate && (
                  <Entry
                    label="Taux horaire (précision reçue)"
                    value={`${formatBomMoney(line.hourlyRate, true)}/h`}
                  />
                )}
                {source?.packagePrice && (
                  <Entry
                    label="Prix du conditionnement (précision reçue)"
                    value={formatBomMoney(source.packagePrice, true)}
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
                {line.diagnostics.map((issue) => (
                  <Entry
                    key={JSON.stringify(issue)}
                    label={issue.code}
                    value={`${issue.source} · ${issue.blocking ? "Bloquant" : "Non bloquant"}`}
                  />
                ))}
              </dl>
            </details>
          </div>
        )}
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Fermer
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Entry({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}
