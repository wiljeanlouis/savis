import { ArrowLeft01Icon, Folder01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            className="size-4"
            strokeWidth={2}
            aria-hidden="true"
          />
          Tous les dossiers
        </Link>
        <div className="flex min-w-0 items-start gap-3">
          <HugeiconsIcon
            icon={Folder01Icon}
            className="mt-1 size-6 shrink-0 text-muted-foreground"
            strokeWidth={2}
            aria-hidden="true"
          />
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
            <p className="mt-2 break-words text-sm font-medium">
              {dossier.situation}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
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
