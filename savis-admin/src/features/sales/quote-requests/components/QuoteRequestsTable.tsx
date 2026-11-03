import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Link } from "react-router";
import { formatOrderDate } from "../../orders/types";
import type { QuoteRequest } from "../model/types";
import { QuoteRequestStatusBadge } from "./QuoteRequestStatusBadge";
import { Button } from "@/shared/ui/button";

const columns: ColumnDef<QuoteRequest>[] = [
  {
    id: "customerName",
    accessorFn: (row) => row.customerName,
    header: "Client",
    cell: ({ row }) => (
      <Link
        className="font-semibold text-primary hover:underline"
        to={`/sales/quote-requests/${row.original.publicId}`}
      >
        {row.original.customerName}
      </Link>
    ),
  },
  {
    id: "receivedAt",
    accessorFn: (row) => row.receivedAt,
    header: "Reçue le",
    cell: ({ row }) => formatOrderDate(row.original.receivedAt),
  },
  {
    id: "status",
    accessorFn: (row) => row.status,
    header: "Statut",
    cell: ({ row }) => <QuoteRequestStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    enableSorting: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <Button asChild variant="outline" size="sm">
        <Link
          aria-label={`Consulter la demande de ${row.original.customerName}`}
          to={`/sales/quote-requests/${row.original.publicId}`}
        >
          Consulter
        </Link>
      </Button>
    ),
  },
];

export function QuoteRequestsTable({
  requests,
  sorting,
  onSort,
}: {
  requests: QuoteRequest[];
  sorting: SortingState;
  onSort: (value: string) => void;
}) {
  return (
    <DataTable
      columns={columns}
      data={requests}
      ariaLabel="Liste des demandes de soumission"
      showPagination={false}
      sorting={sorting}
      onSortingChange={(updater) => {
        const next = typeof updater === "function" ? updater(sorting) : updater;
        if (next[0]) onSort(`${next[0].id}-${next[0].desc ? "desc" : "asc"}`);
      }}
      getRowId={(row) => row.publicId}
    />
  );
}
