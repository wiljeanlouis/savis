import { useState } from "react";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageSelector } from "@/shared/components/PageSelector";
import { Button } from "@/shared/ui/button";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { ButtonGroup } from "@/shared/ui/button-group";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SupplyOfferDetailsDialog } from "../components/SupplyOfferDetailsDialog";
import { SupplyOfferListSorting } from "../components/SupplyOfferListSorting";
import { SupplyOffersTable } from "../components/SupplyOffersTable";
import { useSupplyOffers } from "../hooks/useSupplyOffers";
import type {
  SupplyOffer,
  SupplyOfferSort,
  SupplyOfferSortDirection,
  SupplyOfferSortField,
  SupplyOfferStatusFilter,
} from "../types";

const statusOptions: Array<{
  value: SupplyOfferStatusFilter;
  label: string;
}> = [
  { value: "AVAILABLE", label: "Disponibles" },
  { value: "UNAVAILABLE", label: "Indisponibles" },
  { value: "ALL", label: "Toutes" },
];

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
  const [selectedOffer, setSelectedOffer] = useState<SupplyOffer | null>(null);
  const result = query.data;
  const offers = result?.content ?? [];
  const [sortBy, sortDirection] = sort.split(",") as [
    SupplyOfferSortField,
    SupplyOfferSortDirection,
  ];

  const changeSortBy = (value: SupplyOfferSortField) => {
    setSort(`${value},${sortDirection}` as SupplyOfferSort);
  };

  const toggleSortDirection = () => {
    const nextDirection = sortDirection === "asc" ? "desc" : "asc";
    setSort(`${sortBy},${nextDirection}` as SupplyOfferSort);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Offres fournisseurs</h1>
        <p className="text-sm text-muted-foreground">
          Offres enregistrées dans Supply et disponibles pour le calcul des
          coûts de production.
        </p>
      </header>

      <section
        aria-label="Filtres des offres"
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <Field className="flex-1">
          <ButtonGroup className="w-full">
            <Input
              id="supply-offer-search"
              value={search}
              placeholder="Rechercher dans les offres fournisseurs"
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button variant="outline" type="button" aria-label="Rechercher">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </Button>
          </ButtonGroup>
        </Field>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Label
            htmlFor="supply-offer-status"
            className="whitespace-nowrap text-muted-foreground"
          >
            Filtrer par statut
          </Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as SupplyOfferStatusFilter)
            }
          >
            <SelectTrigger
              id="supply-offer-status"
              className="flex-1 sm:w-48 sm:flex-none"
              aria-label="Filtrer par statut"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SupplyOfferListSorting
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortByChange={changeSortBy}
            onToggleSortDirection={toggleSortDirection}
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
          <SupplyOffersTable offers={offers} onViewDetails={setSelectedOffer} />
          <PageNavigator
            itemName="offre"
            totalItems={result?.totalElements ?? 0}
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
