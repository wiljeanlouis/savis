import type { ImportOrdersResult } from "@/features/sales/orders/types";
import type { ImportResult } from "@/features/sales/quote-requests/model/types";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { getApiErrorMessage } from "@/shared/api/apiError";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

const requestFailureReasons: Record<string, string> = {
  ACKNOWLEDGEMENT_FAILED:
    "La synchronisation n’a pas pu être confirmée. Relancez l’import.",
  INVALID_OR_CONFLICTING_REQUEST:
    "La demande reçue est invalide ou diffère de celle déjà importée.",
};

interface SalesImportAlertProps {
  requestResult: ImportResult | null;
  requestError: unknown;
  orderResult: ImportOrdersResult | undefined;
  orderError: unknown;
}

export function SalesImportAlert({
  requestResult,
  requestError,
  orderResult,
  orderError,
}: SalesImportAlertProps) {
  const [dismissedResult, setDismissedResult] = useState<{
    requestResult: ImportResult | null;
    requestError: unknown;
    orderResult: ImportOrdersResult | undefined;
    orderError: unknown;
  } | null>(null);
  const hasError =
    Boolean(requestError) ||
    Boolean(orderError) ||
    Boolean(requestResult?.failed || requestResult?.acknowledgmentFailed) ||
    Boolean(orderResult?.failedCount || orderResult?.acknowledgmentFailedCount);

  if (!requestResult && !requestError && !orderResult && !orderError) {
    return null;
  }

  const isDismissed =
    dismissedResult?.requestResult === requestResult &&
    dismissedResult.requestError === requestError &&
    dismissedResult.orderResult === orderResult &&
    dismissedResult.orderError === orderError;

  if (isDismissed) return null;

  return (
    <Alert
      variant={hasError ? "destructive" : "default"}
      className="relative pr-12"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2"
        aria-label="Fermer le message d’importation"
        onClick={() =>
          setDismissedResult({
            requestResult,
            requestError,
            orderResult,
            orderError,
          })
        }
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
      </Button>
      <AlertTitle>
        {hasError
          ? "Importation terminée avec des erreurs"
          : "Importation terminée"}
      </AlertTitle>
      <AlertDescription>
        {requestError ? (
          <p>
            <span className="font-medium">Demandes de soumission :</span>{" "}
            {getApiErrorMessage(requestError)}
          </p>
        ) : (
          requestResult && (
            <p>
              <span className="font-medium">Demandes de soumission :</span>{" "}
              {requestResult.imported} importées ·{" "}
              {requestResult.alreadyImported} déjà reçues ·{" "}
              {requestResult.failed} en échec ·{" "}
              {requestResult.acknowledgmentFailed} synchronisations à reprendre
            </p>
          )
        )}
        {requestResult?.failures.length ? (
          <ul className="mt-2 space-y-1">
            {requestResult.failures.map((failure) => (
              <li
                key={`${failure.externalId ?? "request"}:${failure.code}:${failure.reason ?? ""}`}
              >
                <span className="font-medium">
                  {failure.externalId
                    ? `Réception ${failure.externalId}`
                    : "Réception non identifiable"}
                  :
                </span>{" "}
                {failure.reason ||
                  requestFailureReasons[failure.code] ||
                  "Le serveur n’a pas précisé la raison de l’échec."}
              </li>
            ))}
          </ul>
        ) : null}
        {orderError ? (
          <p>
            <span className="font-medium">Commandes :</span>{" "}
            {getApiErrorMessage(orderError)}
          </p>
        ) : (
          orderResult && (
            <p>
              <span className="font-medium">Commandes :</span>{" "}
              {orderResult.importedCount} importées ·{" "}
              {orderResult.alreadyImportedCount} déjà reçues ·{" "}
              {orderResult.failedCount} en échec ·{" "}
              {orderResult.acknowledgmentFailedCount} synchronisations à
              reprendre
            </p>
          )
        )}
        {orderResult?.failures.length ? (
          <ul className="mt-2 space-y-1">
            {orderResult.failures.map((failure) => (
              <li key={failure.externalOrderId}>
                <span className="font-medium">
                  Commande {failure.externalOrderId}:
                </span>{" "}
                {failure.message}
              </li>
            ))}
          </ul>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
