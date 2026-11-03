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
      <div>
        <Link
          className="text-sm text-muted-foreground hover:underline"
          to={{ pathname: "/sales/workspace", search: listSearch }}
        >
          ← Tous les dossiers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{dossier.customerName}</h1>
        <p className="text-sm text-muted-foreground">
          {dossier.reference}
          {dossier.description ? ` · ${dossier.description}` : ""}
        </p>
        <p className="mt-2">{dossier.situation}</p>
        {dossier.lastActivity && (
          <p className="text-sm text-muted-foreground">
            Dernière activité · {formatOrderDate(dossier.lastActivity)}
          </p>
        )}
      </div>

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
