import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/components/DataTable";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  formatSupplyOfferDate,
  formatSupplyOfferPackage,
  formatSupplyOfferPrice,
} from "../format";
import type { SupplyOffer, SupplyOfferSort } from "../types";
import { SupplyOfferImage } from "./SupplyOfferImage";
import { SupplyOfferStatusBadge } from "./SupplyOfferStatusBadge";

interface SupplyOffersTableProps {
  offers: SupplyOffer[];
  resourceNames?: Record<string, string>;
  resourcesLoading?: boolean;
  onViewDetails: (offer: SupplyOffer) => void;
  sort?: SupplyOfferSort;
  onSort?: (value: SupplyOfferSort) => void;
}

type OfferTableMeta = {
  resourceNames: Record<string, string>;
  resourcesLoading: boolean;
  onViewDetails: (offer: SupplyOffer) => void;
};
const columns: ColumnDef<SupplyOffer>[] = [
  {
    id: "product",
    header: "Produit",
    enableSorting: false,
    cell: ({ row }) => {
      const offer = row.original;
      const displayName = offer.label ?? offer.componentName;
      return (
        <>
          <div className="flex items-center gap-3">
            <SupplyOfferImage imageUrl={offer.imageUrl} alt={displayName} />
            <div className="min-w-0">
              <span className="block max-w-56 truncate font-medium">
                {displayName}
              </span>
              <span className="block max-w-56 truncate text-muted-foreground">
                {offer.brand ?? "Marque non renseignée"}
              </span>
            </div>
          </div>
        </>
      );
    },
  },
  {
    id: "componentName",
    header: "Composant",
    accessorFn: (offer) => offer.componentName,
    cell: ({ row }) => {
      const offer = row.original;
      return <>{offer.componentName}</>;
    },
  },
  {
    id: "resource",
    header: "Ressource",
    enableSorting: false,
    cell: ({ row, table }) => {
      const offer = row.original;
      const { resourceNames, resourcesLoading } = table.options
        .meta as OfferTableMeta;
      return (
        <div className="max-w-40 truncate">
          {offer.resourceId
            ? (resourceNames[offer.resourceId] ??
              (resourcesLoading ? "Chargement…" : "Nom indisponible"))
            : "Non associée"}
        </div>
      );
    },
  },
  {
    id: "provider",
    header: "Fournisseur",
    enableSorting: false,
    cell: ({ row }) => {
      const offer = row.original;
      return <>{offer.provider?.name ?? offer.provider?.identifier ?? "—"}</>;
    },
  },
  {
    id: "price",
    header: "Prix du paquet",
    accessorFn: (offer) => offer.price?.amount,
    cell: ({ row }) => {
      const offer = row.original;
      return (
        <div className="font-medium">{formatSupplyOfferPrice(offer.price)}</div>
      );
    },
  },
  {
    id: "package",
    header: "Format",
    enableSorting: false,
    cell: ({ row }) => {
      const offer = row.original;
      return <>{formatSupplyOfferPackage(offer.packageSize)}</>;
    },
  },
  {
    id: "status",
    header: "Statut",
    enableSorting: false,
    cell: ({ row }) => {
      const offer = row.original;
      return (
        <>
          <SupplyOfferStatusBadge status={offer.status} />
        </>
      );
    },
  },
  {
    id: "lastSeen",
    header: "Dernière observation",
    accessorFn: (offer) => offer.lastSeen,
    cell: ({ row }) => {
      const offer = row.original;
      return <>{formatSupplyOfferDate(offer.lastSeen)}</>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row, table }) => {
      const offer = row.original;
      const { onViewDetails } = table.options.meta as OfferTableMeta;
      const displayName = offer.label ?? offer.componentName;
      return (
        <>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(offer)}
              aria-label={`Afficher les détails de ${displayName}`}
            >
              <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
              Détails
            </Button>
          </div>
        </>
      );
    },
  },
];
export function SupplyOffersTable({
  offers,
  resourceNames = {},
  resourcesLoading = false,
  onViewDetails,
  sort = "lastSeen,desc",
  onSort,
}: SupplyOffersTableProps) {
  const [id, direction] = sort.split(",");
  const sorting: SortingState = [{ id, desc: direction === "desc" }];
  return (
    <DataTable
      columns={columns}
      data={offers}
      ariaLabel="Liste des offres fournisseurs"
      showPagination={false}
      sorting={sorting}
      getRowId={(offer) => offer.id}
      meta={{ resourceNames, resourcesLoading, onViewDetails }}
      onSortingChange={(updater) => {
        const next = typeof updater === "function" ? updater(sorting) : updater;
        if (next[0])
          onSort?.(
            `${next[0].id},${next[0].desc ? "desc" : "asc"}` as SupplyOfferSort,
          );
      }}
    />
  );
}
