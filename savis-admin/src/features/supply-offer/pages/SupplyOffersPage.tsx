import { useState } from "react";
import { Button } from "@/shared/ui/button";
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
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SupplyOfferDetailsDialog } from "../components/SupplyOfferDetailsDialog";
import { SupplyOffersTable } from "../components/SupplyOffersTable";
import { useSupplyOffers } from "../hooks/useSupplyOffers";
import type {
  SupplyOffer,
  SupplyOfferSort,
  SupplyOfferStatusFilter,
} from "../types";
import { supplyOfferSortLabels } from "../types";

const statusOptions: Array<{
  value: SupplyOfferStatusFilter;
  label: string;
}> = [
  { value: "AVAILABLE", label: "Disponibles" },
  { value: "UNAVAILABLE", label: "Indisponibles" },
  { value: "ALL", label: "Toutes" },
];

const sortOptions = Object.entries(supplyOfferSortLabels) as Array<
  [SupplyOfferSort, string]
>;

/** Read-only consultation page for offers persisted by Supply. */
export function SupplyOffersPage() {
  const {
    query,
    page,
    search,
    status,
    sort,
    setPage,
    setSearch,
    setStatus,
    setSort,
  } = useSupplyOffers();
  const [selectedOffer, setSelectedOffer] = useState<SupplyOffer | null>(null);
  const result = query.data;
  const offers = result?.content ?? [];

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
        className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[minmax(14rem,1fr)_13rem_17rem]"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="supply-offer-search">Recherche</Label>
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="supply-offer-search"
              className="pl-8"
              value={search}
              placeholder="Composant, produit, marque ou fournisseur"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="supply-offer-status">Statut</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as SupplyOfferStatusFilter)
            }
          >
            <SelectTrigger id="supply-offer-status" className="w-full">
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

        <div className="grid gap-1.5">
          <Label htmlFor="supply-offer-sort">Tri</Label>
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as SupplyOfferSort)}
          >
            <SelectTrigger id="supply-offer-sort" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p aria-live="polite">
          <strong>{result?.totalElements ?? 0}</strong>{" "}
          {(result?.totalElements ?? 0) > 1
            ? "offres trouvées"
            : "offre trouvée"}
        </p>
        {query.isFetching && !query.isPending ? (
          <span className="text-muted-foreground">Actualisation…</span>
        ) : null}
      </div>

      {query.isPending ? (
        <div
          className="flex min-h-64 items-center justify-center"
          aria-label="Chargement des offres"
        >
          <Spinner />
        </div>
      ) : query.isError ? (
        <div
          role="alert"
          className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive"
        >
          <p>Impossible de charger les offres fournisseurs.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void query.refetch()}
          >
            Réessayer
          </Button>
        </div>
      ) : offers.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
          Aucune offre ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <>
          <SupplyOffersTable offers={offers} onViewDetails={setSelectedOffer} />
          <nav
            aria-label="Pagination des offres"
            className="flex flex-col items-center justify-between gap-3 sm:flex-row"
          >
            <p className="text-sm text-muted-foreground">
              Page {page + 1} sur {result?.totalPages ?? 1} ·{" "}
              {result?.totalElements ?? 0} résultat(s)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                Précédente
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!result || page + 1 >= result.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Suivante
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Button>
            </div>
          </nav>
        </>
      )}

      <SupplyOfferDetailsDialog
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
      />
    </div>
  );
}
