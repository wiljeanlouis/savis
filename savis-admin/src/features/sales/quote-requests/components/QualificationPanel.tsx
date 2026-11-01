import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit02Icon } from "@hugeicons/core-free-icons";
import type { QuoteRequest } from "../model/types";
import { QualificationForm } from "./QualificationForm";
import { parseOriginalRequest, needLabel } from "../model/originalRequest";
export function QualificationPanel({ request }: { request: QuoteRequest }) {
  const [editing, setEditing] = useState(false);
  const q = request.qualification;
  const original = parseOriginalRequest(request.originalPayload);
  if (editing)
    return (
      <QualificationForm
        request={request}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Qualification</CardTitle>
              <p className="mt-1 text-muted-foreground">
                Préparez les besoins retenus avant de créer une proposition
                commerciale.
              </p>
            </div>
            {request.status !== "CLOSED" && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                {q ? "Modifier la qualification" : "Qualifier la demande"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {q ? (
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Client retenu</dt>
                <dd className="mt-1 font-medium">{q.customerName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Lignes préparées</dt>
                <dd className="mt-1 font-medium">{q.lines.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Besoins exclus</dt>
                <dd className="mt-1 font-medium">
                  {Object.keys(q.exclusions).length}
                </dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="text-muted-foreground">Notes internes</dt>
                <dd className="mt-1 whitespace-pre-wrap">
                  {q.internalNotes || "Aucune note interne"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="py-4 text-center text-muted-foreground">
              Cette demande n’a pas encore été qualifiée.
            </p>
          )}
        </CardContent>
      </Card>
      {q && Object.keys(q.exclusions).length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Exclusions motivées</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {Object.entries(q.exclusions).map(([key, reason]) => (
                <div key={key}>
                  <dt className="font-medium">{needLabel(key, original)}</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {reason}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
