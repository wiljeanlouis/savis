import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  formatPhoneForDisplay,
  phoneHref,
} from "@/features/sales/orders/model/contactFormat";
import {
  formatOrderCurrency,
  formatOrderDate,
} from "@/features/sales/orders/types";
import { DataTable } from "@/shared/components/DataTable";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { FileViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import type { Quotation } from "../types";
import { quotationStatusLabels } from "../types";
import { QuotationStatusBadge } from "./QuotationStatusBadge";

/** Lists quotation commercial data and document actions. */
export function QuotationsTable({
  quotations,
  sorting,
  onSort,
  openingQuotationId,
  onOpen,
}: {
  quotations: Quotation[];
  sorting: SortingState;
  onSort: (value: string) => void;
  openingQuotationId?: string;
  onOpen: (quotationId: string) => void;
}) {
  const columns: ColumnDef<Quotation>[] = [
    {
      id: "quotationNumber",
      accessorFn: (row) => row.quotationNumber,
      header: "Soumission",
      cell: ({ row }) => (
        <Link
          className="font-semibold text-primary hover:underline"
          to={`/quotations/${row.original.id}`}
        >
          {row.original.quotationNumber}
        </Link>
      ),
    },
    {
      id: "customerName",
      accessorFn: (row) => row.customerName,
      header: "Client",
      cell: ({ row }) => row.original.customerName,
    },
    {
      id: "customerPhone",
      accessorFn: (row) => row.customerPhone,
      header: "Téléphone",
      cell: ({ row }) => (
        <a
          className="hover:underline"
          href={`tel:${phoneHref(row.original.customerPhone)}`}
        >
          {formatPhoneForDisplay(row.original.customerPhone)}
        </a>
      ),
    },
    {
      id: "itemCount",
      accessorFn: (row) => row.items.length,
      header: "Articles",
      cell: ({ row }) => row.original.items.length,
    },
    {
      id: "totalCents",
      accessorFn: (row) => row.totalCents,
      header: "Total",
      cell: ({ row }) => (
        <span className="font-medium">
          {formatOrderCurrency(row.original.totalCents)}
        </span>
      ),
    },
    {
      id: "validUntil",
      accessorFn: (row) => row.validUntil,
      header: "Validité",
      cell: ({ row }) => formatDateOnly(row.original.validUntil),
    },
    {
      id: "status",
      accessorFn: (row) => quotationStatusLabels[row.status],
      header: "Statut",
      cell: ({ row }) => <QuotationStatusBadge status={row.original.status} />,
    },
    {
      id: "createdAt",
      accessorFn: (row) => row.createdAt,
      header: "Créée",
      cell: ({ row }) => formatOrderDate(row.original.createdAt),
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <span className="sr-only">Document</span>,
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={openingQuotationId === row.original.id}
          onClick={() => onOpen(row.original.id)}
          aria-label={`Ouvrir ${row.original.quotationNumber} dans un nouvel onglet`}
        >
          {openingQuotationId === row.original.id ? (
            <Spinner />
          ) : (
            <HugeiconsIcon icon={FileViewIcon} strokeWidth={2} />
          )}
          Voir PDF
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={quotations}
      ariaLabel="Liste des soumissions"
      showPagination={false}
      sorting={sorting}
      onSortingChange={(updater) => {
        const next = typeof updater === "function" ? updater(sorting) : updater;
        if (next[0]) onSort(`${next[0].id}-${next[0].desc ? "desc" : "asc"}`);
      }}
      getRowId={(row) => row.id}
      columnAlignments={{ itemCount: "right", totalCents: "right" }}
    />
  );
}

export function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`),
  );
}
