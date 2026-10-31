import { useRef, useState } from "react";
import { Link } from "react-router";
import { PageSelector } from "@/shared/components/PageSelector";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Spinner } from "@/shared/ui/spinner";
import { Button } from "@/shared/ui/button";
import { DetailSheet } from "@/shared/components/DetailSheet";
import { BomComponentListFilters } from "./BomComponentListFilters";
import { BomComponentReviewTable } from "./BomComponentReviewTable";
import { useBomComponentList } from "../hooks/useBomComponentList";
import { BomComponentRetrieveDialog } from "./BomComponentRetrieveDialog";
import { BomComponentReviewDetails } from "./BomComponentReviewDetails";

export const BomComponentList = () => {
  const list = useBomComponentList();
  const { data, listState } = list;
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const items = data?.items ?? [];
  const selected = items.find((offer) => offer.id === selectedId);

  return (
    <div ref={listRef} className="min-w-0 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Validation des offres</h1>
          <p className="text-sm text-muted-foreground">
            Examinez et validez les offres fournisseurs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BomComponentRetrieveDialog
            isRetrieving={list.isCreatingTask}
            onRetrieve={list.handleRetrieve}
          />
          <Link
            to="/offers/tasks"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Tâches d'acquisition <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>
      <div className="space-y-3">
        <BomComponentListFilters list={list} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <PageItemCount
              itemName="offre"
              totalItems={
                list.isLoading || list.isError ? undefined : data?.total_items
              }
            />
            {list.isFetching && !list.isLoading && (
              <span className="text-sm text-muted-foreground" role="status">
                Actualisation…
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PageSelector
              pageSize={listState.pageSize}
              onPageChange={list.handlePageSizeChange}
            />
          </div>
        </div>
        {list.isLoading ? (
          <div
            className="flex min-h-64 items-center justify-center"
            aria-label="Chargement des offres"
          >
            <Spinner />
          </div>
        ) : list.isError ? (
          <ApiErrorAlert
            title="Impossible de charger les offres à valider."
            error={list.error}
          >
            <Button variant="outline" onClick={() => void list.refetch()}>
              Réessayer
            </Button>
          </ApiErrorAlert>
        ) : !items.length ? (
          <div
            role="status"
            className="flex min-h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card/50 px-5 py-8 text-center"
          >
            <span
              className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-lg text-muted-foreground"
              aria-hidden="true"
            >
              ✓
            </span>
            <p className="font-medium">
              Aucune offre ne correspond aux filtres sélectionnés.
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Modifiez le statut ou le terme de recherche pour consulter
              d’autres offres.
            </p>
          </div>
        ) : (
          <>
            <BomComponentReviewTable
              offers={items}
              sortBy={listState.sortBy}
              sortDirection={listState.sortDirection}
              onSort={list.handleSortChange}
              onViewDetails={(offer) => {
                setSelectedId(offer.id);
              }}
            />
            <PageNavigator
              page={data?.page ?? 1}
              totalPages={data?.total_pages ?? 0}
              goToNextPage={list.goToNextPage}
              goToPreviousPage={list.goToPreviousPage}
            />
          </>
        )}
      </div>
      <DetailSheet
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title="Détails de l’offre à valider"
        listRef={listRef}
      >
        {selected && (
          <BomComponentReviewDetails
            key={selected.id}
            offer={selected}
            busy={list.isPatching || list.isDeleting}
            onPatch={list.handleQuickPatch}
            onEdit={list.handleEdit}
            onDelete={list.handleDelete}
          />
        )}
      </DetailSheet>
    </div>
  );
};
