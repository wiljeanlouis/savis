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
import type { Invoice } from "../types";
import { invoiceDisplayNumber, invoiceStatusLabels } from "../types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

export function InvoicesTable({
  invoices,
  sorting,
  onSort,
  openingInvoiceId,
  onOpen,
}: {
  invoices: Invoice[];
  sorting: SortingState;
  onSort: (value: string) => void;
  openingInvoiceId?: string;
  onOpen: (invoiceId: string) => void;
}) {
  const columns: ColumnDef<Invoice>[] = [
    {
      id: "invoiceNumber",
      accessorFn: (row) => invoiceDisplayNumber(row),
      header: "Facture",
      cell: ({ row }) => (
        <Link
          className="font-semibold text-primary hover:underline"
          to={`/invoices/${row.original.id}`}
        >
          {invoiceDisplayNumber(row.original)}
        </Link>
      ),
    },
    {
      id: "sourceOrderNumber",
      accessorFn: (row) => row.sourceOrderNumber,
      header: "Commande",
      cell: ({ row }) => (
        <Link
          className="hover:underline"
          to={`/orders/${row.original.sourceOrderId}`}
        >
          {row.original.sourceOrderNumber}
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
      id: "status",
      accessorFn: (row) => invoiceStatusLabels[row.status],
      header: "Statut",
      cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
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
      cell: ({ row }) =>
        row.original.invoiceNumber ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={openingInvoiceId === row.original.id}
            onClick={() => onOpen(row.original.id)}
            aria-label={`Ouvrir ${invoiceDisplayNumber(row.original)} dans un nouvel onglet`}
          >
            {openingInvoiceId === row.original.id ? (
              <Spinner />
            ) : (
              <HugeiconsIcon icon={FileViewIcon} strokeWidth={2} />
            )}
            Voir PDF
          </Button>
        ) : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={invoices}
      ariaLabel="Liste des factures"
      showPagination={false}
      sorting={sorting}
      onSortingChange={(updater) => {
        const next = typeof updater === "function" ? updater(sorting) : updater;
        if (next[0]) onSort(`${next[0].id}-${next[0].desc ? "desc" : "asc"}`);
      }}
      getRowId={(row) => row.id}
      columnAlignments={{ totalCents: "right" }}
    />
  );
}
