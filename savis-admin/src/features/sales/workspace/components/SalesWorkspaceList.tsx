import { NoData } from "@/shared/components/NoData";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { PageSelector } from "@/shared/components/PageSelector";
import { ArrowRight01Icon, Folder01Icon } from "@hugeicons/core-free-icons";
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
        <CardContent
          className={
            data.content.length > 0
              ? "grid grid-cols-1 gap-3 lg:grid-cols-2"
              : undefined
          }
        >
          {data.content.length === 0 ? (
            <NoData
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={onResetFilters}
                >
                  Réinitialiser les filtres
                </Button>
              }
            >
              Aucun dossier ne correspond aux critères actuels.
            </NoData>
          ) : (
            data.content.map((dossier) => {
              const dossierPath = `/sales/workspace/${encodeURIComponent(dossier.id)}`;
              const dossierLocation = {
                pathname: dossierPath,
                search: locationSearch,
              };

              return (
                <article key={dossier.id} className="rounded-md border">
                  <Link
                    className="group flex items-start gap-3 rounded-md p-3 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:py-2.5"
                    to={dossierLocation}
                    aria-label={`Ouvrir le dossier ${dossier.reference} pour ${dossier.customerName}`}
                  >
                    <HugeiconsIcon
                      icon={Folder01Icon}
                      className="size-5 shrink-0 text-muted-foreground"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <div
                      className="min-w-0 flex-1 space-y-0.5"
                      data-testid="workspace-dossier-details"
                    >
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-col items-start gap-y-0.5">
                          <span className="break-words font-medium">
                            {dossier.customerName}
                          </span>
                          <span className="break-words text-sm text-primary underline-offset-4 group-hover:underline">
                            {dossier.reference}
                          </span>
                        </div>
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
                      <p className="break-words text-sm font-medium">
                        {dossier.situation}
                      </p>
                      <p className="break-words text-sm text-muted-foreground">
                        {dossier.lastActivity
                          ? `Dernière activité · ${formatOrderDate(dossier.lastActivity)}`
                          : "Aucune activité datée"}
                      </p>
                    </div>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </Link>
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
