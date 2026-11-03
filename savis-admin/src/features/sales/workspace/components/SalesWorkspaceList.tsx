import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { PageSelector } from "@/shared/components/PageSelector";
import { Folder01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
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
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PageItemCount itemName="dossier" totalItems={data.totalElements} />
        <PageSelector
          pageSize={size}
          onPageChange={onPageSizeChange}
          options={[...salesWorkspacePageSizeOptions]}
        />
      </div>
      <Card>
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
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:gap-3 sm:py-2.5"
                >
                  <HugeiconsIcon
                    icon={Folder01Icon}
                    className="size-5 shrink-0 text-muted-foreground"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex min-w-0 flex-col items-start gap-y-0.5">
                      <span className="break-words font-medium">
                        {dossier.customerName}
                      </span>
                      <Link
                        className="rounded-sm text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        to={dossierLocation}
                      >
                        {dossier.reference}
                      </Link>
                    </div>
                    {dossier.description && (
                      <p className="break-words text-sm text-muted-foreground">
                        {dossier.description}
                      </p>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5 text-sm sm:items-end sm:text-right">
                    <span className="break-words font-medium">
                      {dossier.situation}
                    </span>
                    <span className="text-muted-foreground">
                      {dossier.lastActivity
                        ? `Dernière activité · ${formatOrderDate(dossier.lastActivity)}`
                        : "Aucune activité datée"}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </CardContent>
      </Card>
      <nav aria-label="Pagination des dossiers">
        <PageNavigator
          page={page + 1}
          totalPages={Math.max(data.totalPages, 1)}
          goToPreviousPage={() => onPageChange(page - 1)}
          goToNextPage={() => onPageChange(page + 1)}
        />
      </nav>
    </>
  );
}
