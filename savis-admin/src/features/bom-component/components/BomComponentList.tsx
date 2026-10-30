import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { PageSelector } from "@/shared/components/PageSelector";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Spinner } from "@/shared/ui/spinner";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { SupplyOfferImage } from "@/features/supply-offer/components/SupplyOfferImage";
import { useBomComponentList } from "../hooks/useBomComponentList";
import { BomComponentSearchTermFacets } from "./BomComponentSearchTermFacets";
import { BomComponentListSorting } from "./BomComponentListSorting";
import { BomComponentRetrieveDialog } from "./BomComponentRetrieveDialog";
import {
  BomComponentReviewDetails,
  reviewPrice,
  reviewPackage,
  reviewStatusLabels,
} from "./BomComponentReviewDetails";
import type { BomComponentStatus } from "../types";

export const BomComponentList = () => {
  const list = useBomComponentList();
  const { data, listState } = list;
  const [selection, setSelection] = useState({ id: "", index: 0 });
  const [mobileDetail, setMobileDetail] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const items = data?.items ?? [];
  const selected =
    items.find((offer) => offer.id === selection.id) ??
    items[Math.min(selection.index, items.length - 1)];

  useEffect(() => {
    if (mobileDetail && window.matchMedia?.("(max-width: 1023px)").matches) {
      detailRef.current?.focus();
    }
  }, [mobileDetail, selected?.id]);

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">À valider</h1>
          <p className="text-sm text-muted-foreground">
            Examinez les offres découvertes et validez celles à utiliser pour la
            production.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/offers/tasks">Tâches d'acquisition</Link>
          </Button>
          <BomComponentRetrieveDialog
            isRetrieving={list.isCreatingTask}
            onRetrieve={list.handleRetrieve}
          />
        </div>
      </header>
      <section
        aria-label="Filtres des offres à valider"
        className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
      >
        <Select
          value={listState.status}
          onValueChange={(status) =>
            list.handleStatusChange(status as BomComponentStatus | "ALL")
          }
        >
          <SelectTrigger className="w-44" aria-label="Statut de validation">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NEW">À valider</SelectItem>
            <SelectItem value="VALID">Validées</SelectItem>
            <SelectItem value="REJECTED">Rejetées</SelectItem>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
          </SelectContent>
        </Select>
        <BomComponentSearchTermFacets
          status={listState.status === "ALL" ? undefined : listState.status}
          selectedSearchTerm={listState.searchTerm}
          onSearchTermChange={list.handleSearchTermChange}
        />
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PageItemCount
            itemName="offre"
            totalItems={
              list.isLoading || list.isError ? undefined : data?.total_items
            }
          />
          <BomComponentListSorting
            sortBy={listState.sortBy}
            handleSortByChange={list.handleSortByChange}
            toggleSortDirection={list.toggleSortDirection}
            sortDirection={listState.sortDirection}
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
            Modifiez le statut ou le terme de recherche pour consulter d’autres
            offres.
          </p>
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className={mobileDetail ? "hidden min-w-0 lg:block" : "min-w-0"}>
            <ul
              aria-label="Offres découvertes"
              className="divide-y overflow-hidden rounded-xl border bg-card"
            >
              {items.map((offer, index) => (
                <li key={offer.id}>
                  <button
                    type="button"
                    aria-pressed={selected?.id === offer.id}
                    aria-label={`Consulter ${offer.label}`}
                    onClick={() => {
                      setSelection({ id: offer.id, index });
                      setMobileDetail(true);
                    }}
                    className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)_minmax(5rem,auto)] items-center gap-x-2.5 border-l-[3px] border-transparent py-2.5 pr-3 pl-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px] aria-pressed:border-primary aria-pressed:bg-primary/10 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(5.5rem,auto)]"
                  >
                    <SupplyOfferImage
                      imageUrl={offer.image_url}
                      alt={offer.label}
                      className="size-10 object-contain sm:size-12"
                    />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block truncate text-sm leading-snug font-medium">
                        {offer.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[offer.brand, offer.provider.name]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        Recherche : {offer.search_term}
                      </span>
                    </span>
                    <span className="min-w-0 space-y-1 text-right">
                      <span className="block truncate text-sm font-semibold tabular-nums">
                        {reviewPrice(offer)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {reviewPackage(offer)}
                      </span>
                      <Badge
                        variant={
                          offer.status === "REJECTED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {reviewStatusLabels[offer.status]}
                      </Badge>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <PageNavigator
              page={data?.page ?? 1}
              totalPages={data?.total_pages ?? 0}
              goToNextPage={list.goToNextPage}
              goToPreviousPage={list.goToPreviousPage}
            />
          </div>
          {selected && (
            <div
              ref={detailRef}
              tabIndex={-1}
              className={`${mobileDetail ? "fixed inset-0 z-40 flex" : "hidden"} min-h-0 min-w-0 flex-col gap-2 bg-background p-3 outline-none lg:sticky lg:inset-auto lg:top-4 lg:z-auto lg:flex lg:bg-transparent lg:p-0`}
            >
              <Button
                variant="outline"
                className="min-h-10 shrink-0 self-start lg:hidden"
                onClick={() => setMobileDetail(false)}
              >
                Retour à la liste
              </Button>
              <BomComponentReviewDetails
                key={selected.id}
                offer={selected}
                busy={list.isPatching || list.isDeleting}
                onPatch={list.handleQuickPatch}
                onEdit={list.handleEdit}
                onDelete={list.handleDelete}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
