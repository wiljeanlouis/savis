import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Link } from "react-router";
import { formatOrderDate } from "../../orders/types";
import type { SalesWorkspaceDossier as SalesWorkspaceDossierType } from "../api/workspaceApi";
import { SalesWorkspaceBranch } from "./SalesWorkspaceBranch";

export function SalesWorkspaceDossier({
  dossier,
  returnTo,
  listSearch,
}: {
  dossier: SalesWorkspaceDossierType;
  returnTo: string;
  listSearch: string;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link
          className="inline-flex min-h-9 items-center gap-2 rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          to={{ pathname: "/sales/workspace", search: listSearch }}
        >
          ← Tous les dossiers
        </Link>
        <div className="flex justify-between min-w-0 items-start gap-3">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold tracking-tight">
              {dossier.customerName}
            </h1>
            <p className="mt-1 break-words text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {dossier.reference}
              </span>
              {dossier.description ? ` · ${dossier.description}` : ""}
            </p>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
              <p className="break-words text-sm font-medium">
                {dossier.situation}
              </p>
              <span
                className={
                  dossier.requiresAction
                    ? "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                    : "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    dossier.requiresAction
                      ? "size-1.5 rounded-full bg-amber-600 dark:bg-amber-400"
                      : "size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                  }
                />
                {dossier.requiresAction ? "À traiter" : "Terminé"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground sm:text-right">
              {dossier.lastActivity
                ? `Dernière activité · ${formatOrderDate(dossier.lastActivity)}`
                : "Aucune activité datée"}
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Parcours commercial</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesWorkspaceBranch branch={dossier.root} returnTo={returnTo} />
        </CardContent>
      </Card>
    </div>
  );
}
