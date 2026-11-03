import { PageNavigator } from "@/shared/components/PageNavigator";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Link } from "react-router";
import { formatOrderDate } from "../../orders/types";
import type { SalesWorkspacePage } from "../api/workspaceApi";
import { salesWorkspacePageSizeOptions } from "../model/workspacePresentation";

export function SalesWorkspaceList({
  data,
  page,
  size,
  locationSearch,
  onResetFilters,
  onPageChange,
  onPageSizeChange,
}: {
  data: SalesWorkspacePage;
  page: number;
  size: number;
  locationSearch: string;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dossiers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.content.length === 0 ? (
          <div className="space-y-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun dossier ne correspond aux critères actuels.
            </p>
            <Button type="button" variant="outline" onClick={onResetFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          data.content.map((dossier) => {
            const dossierPath = `/sales/workspace/${encodeURIComponent(dossier.id)}`;
            const dossierLocation = {
              pathname: dossierPath,
              search: locationSearch,
            };

            return (
              <article
                key={dossier.id}
                className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <Link
                    className="font-medium hover:underline"
                    to={dossierLocation}
                  >
                    {dossier.customerName}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {dossier.reference}
                    {dossier.description ? ` · ${dossier.description}` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-1 text-sm md:items-end">
                  <span>{dossier.situation}</span>
                  <span className="text-muted-foreground">
                    {dossier.lastActivity
                      ? `Dernière activité · ${formatOrderDate(dossier.lastActivity)}`
                      : "Aucune activité datée"}
                  </span>
                </div>
                <Button asChild variant="outline">
                  <Link to={dossierLocation}>Ouvrir le dossier</Link>
                </Button>
              </article>
            );
          })
        )}
        <nav aria-label="Pagination des dossiers">
          <PageNavigator
            page={page + 1}
            totalPages={Math.max(data.totalPages, 1)}
            goToPreviousPage={() => onPageChange(page - 1)}
            goToNextPage={() => onPageChange(page + 1)}
            pageSize={size}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[...salesWorkspacePageSizeOptions]}
          />
        </nav>
      </CardContent>
    </Card>
  );
}
