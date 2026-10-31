import { useQuery } from "@tanstack/react-query";
import { getResourcesByIds } from "@/features/resource/api/resourceApi";
import { ManualOfferDialog } from "../components/ManualOfferDialog";
import { useState } from "react";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { PageSelector } from "@/shared/components/PageSelector";
import { Button } from "@/shared/ui/button";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Spinner } from "@/shared/ui/spinner";
import { SupplyOfferListFilters } from "../components/SupplyOfferListFilters";
import { SupplyOfferDetailsDialog } from "../components/SupplyOfferDetailsDialog";
import { SupplyOffersTable } from "../components/SupplyOffersTable";
import { useSupplyOffers } from "../hooks/useSupplyOffers";
import type { SupplyOffer } from "../types";

/** Read-only consultation page for offers persisted by Supply. */
export function SupplyOffersPage() {
  const {
    query,
    page,
    pageSize,
    search,
    status,
    sort,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setSort,
  } = useSupplyOffers();
  const [creating, setCreating] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<SupplyOffer | null>(null);
  const result = query.data;
  const offers = result?.content ?? [];
  const resourceIds = [
    ...new Set(
      offers.flatMap((offer) => (offer.resourceId ? [offer.resourceId] : [])),
    ),
  ].sort();
  const resources = useQuery({
    queryKey: ["resources", "batch", resourceIds],
    queryFn: () => getResourcesByIds(resourceIds),
    enabled: resourceIds.length > 0,
  });
  const resourceNames = Object.fromEntries(
    (resources.data ?? []).map((resource) => [resource.id, resource.name]),
  );
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Offres fournisseurs</h1>
          <p className="text-sm text-muted-foreground">
            Offres enregistrées dans Supply et disponibles pour le calcul des
            coûts de production.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>Nouvelle offre</Button>
      </header>
      {creating && <ManualOfferDialog onClose={() => setCreating(false)} />}

      <SupplyOfferListFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <PageItemCount
            itemName="offre"
            totalItems={
              query.isPending || query.isError
                ? undefined
                : result?.totalElements
            }
          />
          {query.isFetching && !query.isPending ? (
            <span className="text-sm text-muted-foreground">
              Actualisation…
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <PageSelector pageSize={pageSize} onPageChange={setPageSize} />
        </div>
      </div>

      {query.isPending ? (
        <div
          className="flex min-h-64 items-center justify-center"
          aria-label="Chargement des offres"
        >
          <Spinner />
        </div>
      ) : query.isError ? (
        <ApiErrorAlert
          title="Impossible de charger les offres fournisseurs."
          error={query.error}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => void query.refetch()}
          >
            Réessayer
          </Button>
        </ApiErrorAlert>
      ) : offers.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
          Aucune offre ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <>
          {resources.isError && (
            <ApiErrorAlert
              title="Impossible de charger les noms des ressources."
              error={resources.error}
            >
              <Button
                variant="outline"
                onClick={() => void resources.refetch()}
              >
                Réessayer
              </Button>
            </ApiErrorAlert>
          )}
          <SupplyOffersTable
            offers={offers}
            sort={sort}
            onSort={setSort}
            resourceNames={resourceNames}
            resourcesLoading={resourceIds.length > 0 && resources.isPending}
            onViewDetails={setSelectedOffer}
          />
          <PageNavigator
            page={page + 1}
            totalPages={result?.totalPages ?? 0}
            goToPreviousPage={() => setPage(page - 1)}
            goToNextPage={() => setPage(page + 1)}
          />
        </>
      )}

      <SupplyOfferDetailsDialog
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
      />
    </div>
  );
}
