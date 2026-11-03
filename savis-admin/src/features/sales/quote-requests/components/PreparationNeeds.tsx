import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import {
  effectiveQualification,
  type PreparedNeed,
  type QuoteRequest,
  type QualifiedLine,
} from "../model/types";
import {
  configurationLabels,
  needLabel,
  parseOriginalRequest,
} from "../model/originalRequest";

const stateLabels: Record<PreparedNeed["state"], string> = {
  RECOGNIZED: "Reconnu",
  REVIEW: "À vérifier",
  UNRESOLVED: "Non résolu",
  CUSTOM: "Personnalisé",
};

export function PreparationNeeds({
  request,
  onUseSelection,
}: {
  request: QuoteRequest;
  onUseSelection?: (line: QualifiedLine) => void;
}) {
  const original = parseOriginalRequest(request.originalPayload);
  const needs = request.preparation?.needs ?? [];
  const q = effectiveQualification(request);
  function renderNeed(need: PreparedNeed) {
    const included = q?.lines.some((line) =>
      line.needKeys.includes(need.needKey),
    );
    const excluded = q?.exclusions[need.needKey];
    const item = need.needKey.startsWith("item:")
      ? original.items?.[Number(need.needKey.slice(5))]
      : undefined;
    return (
      <div className="space-y-1 rounded-lg border p-4" key={need.needKey}>
        <p className="font-medium">
          {needLabel(need.needKey, original)} · {stateLabels[need.state]}
        </p>
        <p>Produit Catalog : {need.productName ?? "Non identifié"}</p>
        {item && (
          <p>
            Quantité demandée : {item.requested_quantity} ·{" "}
            {configurationLabels(item.configuration).join(" · ") ||
              "Configuration non précisée"}
          </p>
        )}
        {onUseSelection && need.requestedLine && !included && !excluded && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onUseSelection(need.requestedLine!)}
          >
            Reprendre cette configuration pour la corriger
          </Button>
        )}
        {need.issue && <p className="text-muted-foreground">{need.issue}</p>}
        <p className="text-sm text-muted-foreground">
          {excluded
            ? `Exclu : ${excluded}`
            : included
              ? "Inclus dans la préparation"
              : "Non inclus dans cette préparation"}
        </p>
      </div>
    );
  }
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Produits proposés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {needs.filter((n) => n.state === "RECOGNIZED").map(renderNeed)}
          {!needs.some((n) => n.state === "RECOGNIZED") && (
            <p>Aucun article reconnu automatiquement.</p>
          )}
          {request.qualification && (
            <p className="text-sm text-muted-foreground">
              Les quantités, configurations et décisions enregistrées sont
              conservées. Les états ci-dessus vérifient les références de la
              demande originale.
            </p>
          )}
        </CardContent>
      </Card>
      {needs.some((n) => n.state !== "RECOGNIZED") && (
        <Card>
          <CardHeader>
            <CardTitle>Besoins nécessitant une intervention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {needs.filter((n) => n.state !== "RECOGNIZED").map(renderNeed)}
          </CardContent>
        </Card>
      )}
    </>
  );
}
