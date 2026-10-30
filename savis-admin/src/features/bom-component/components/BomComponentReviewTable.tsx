import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { SupplyOfferImage } from "@/features/supply-offer/components/SupplyOfferImage";
import { formatSupplyOfferDate } from "@/features/supply-offer/format";
import {
  reviewPrice,
  reviewPackage,
  reviewStatusLabels,
  reviewStatusBadgeClass,
} from "./BomComponentReviewDetails";
import type { BomComponent } from "../types";

const columns: ColumnDef<BomComponent>[] = [
  {
    id: "label",
    accessorKey: "label",
    header: "Produit",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <SupplyOfferImage
          imageUrl={row.original.image_url}
          alt={row.original.label}
        />
        <div className="min-w-0">
          <span className="block max-w-56 truncate font-medium">
            {row.original.label}
          </span>
          <span className="block max-w-56 truncate text-muted-foreground">
            {row.original.brand || "Marque non renseignée"}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "search_term",
    header: "Terme de recherche",
    accessorKey: "search_term",
  },
  {
    id: "provider",
    header: "Fournisseur",
    accessorFn: (offer) => offer.provider.name,
  },
  {
    id: "price",
    accessorFn: (offer) => offer.price?.amount,
    header: "Prix du paquet",
    cell: ({ row }) => (
      <span className="font-medium">{reviewPrice(row.original)}</span>
    ),
  },
  {
    id: "package_size",
    accessorKey: "package_size",
    header: "Format",
    cell: ({ row }) => reviewPackage(row.original),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "REJECTED" ? "destructive" : "outline"}
        className={reviewStatusBadgeClass(row.original.status)}
      >
        {reviewStatusLabels[row.original.status]}
      </Badge>
    ),
  },
  {
    id: "last_retrieved_at",
    accessorKey: "last_retrieved_at",
    header: "Dernière observation",
    cell: ({ row }) => formatSupplyOfferDate(row.original.last_retrieved_at),
  },
  {
    id: "next_refresh_at",
    accessorKey: "next_refresh_at",
    header: "Prochaine actualisation",
    cell: ({ row }) => formatSupplyOfferDate(row.original.next_refresh_at),
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row, table }) => {
      const offer = row.original;
      const { onViewDetails } = table.options.meta as {
        onViewDetails: (offer: BomComponent) => void;
      };
      return (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(offer)}
            aria-label={`Consulter ${offer.label}`}
          >
            Détails
          </Button>
        </div>
      );
    },
  },
];

export function BomComponentReviewTable({
  offers,
  sortBy,
  sortDirection,
  onSort,
  onViewDetails,
}: {
  offers: BomComponent[];
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string, direction: "asc" | "desc") => void;
  onViewDetails: (offer: BomComponent) => void;
}) {
  const sorting: SortingState = [
    { id: sortBy, desc: sortDirection === "desc" },
  ];
  return (
    <DataTable
      columns={columns}
      data={offers}
      ariaLabel="Offres découvertes"
      showPagination={false}
      getRowId={(offer) => offer.id}
      meta={{ onViewDetails }}
      sorting={sorting}
      onSortingChange={(updater) => {
        const next = typeof updater === "function" ? updater(sorting) : updater;
        if (next[0]) onSort(next[0].id, next[0].desc ? "desc" : "asc");
      }}
    />
  );
}
