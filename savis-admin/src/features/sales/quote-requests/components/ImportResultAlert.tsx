import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import type { ImportResult } from "../model/types";
const failureReasons: Record<string, string> = {
  ACKNOWLEDGEMENT_FAILED:
    "La synchronisation n’a pas pu être confirmée. Relancez l’import.",
  INVALID_OR_CONFLICTING_REQUEST:
    "La demande reçue est invalide ou diffère de celle déjà importée.",
};
export function ImportResultAlert({ result }: { result: ImportResult }) {
  const failed = result.failed > 0 || result.acknowledgmentFailed > 0;
  const failures = result.failures.map((failure, position) => ({
    ...failure,
    key: `failure:${position}`,
  }));
  return (
    <Alert variant={failed ? "destructive" : "default"}>
      <AlertTitle>
        {failed
          ? "Importation terminée avec des erreurs"
          : "Importation terminée"}
      </AlertTitle>
      <AlertDescription>
        <p>
          {result.imported} importées · {result.alreadyImported} déjà reçues ·{" "}
          {result.failed} en échec · {result.acknowledgmentFailed}{" "}
          synchronisations à reprendre
        </p>
        {failures.length > 0 && (
          <ul className="mt-3 space-y-2">
            {failures.map((failure) => (
              <li key={failure.key}>
                <span className="font-medium">
                  {failure.externalId
                    ? `Réception ${failure.externalId}`
                    : "Réception non identifiable"}{" "}
                  :{" "}
                </span>
                {failure.reason ||
                  failureReasons[failure.code] ||
                  "Le serveur n’a pas précisé la raison de l’échec."}
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
