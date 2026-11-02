import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Link } from "react-router";
import type { OrderSummary } from "../types";
import { formatPhoneForDisplay, phoneHref } from "../model/contactFormat";
import {
  formatOrderCurrency,
  formatOrderDate,
  orderSourceLabels,
  orderStatusLabels,
} from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderProductImage } from "./OrderProductImage";

const columns: ColumnDef<OrderSummary>[] = [
  {
    id: "orderNumber",
    accessorFn: (row) => row.orderNumber,
    header: "Commande",
    cell: ({ row }) => (
      <Link
        className="font-semibold text-primary hover:underline"
        to={`/orders/${row.original.id}`}
      >
        {row.original.orderNumber}
      </Link>
    ),
  },
  {
    id: "itemCount",
    accessorFn: (row) => row.itemCount,
    header: "Articles",
    cell: ({ row }) => <OrderItemsPreview order={row.original} />,
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
    id: "source",
    accessorFn: (row) => orderSourceLabels[row.source],
    header: "Source",
    cell: ({ row }) => orderSourceLabels[row.original.source],
  },
  {
    id: "status",
    accessorFn: (row) => orderStatusLabels[row.status],
    header: "Statut",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },
  {
    id: "placedAt",
    accessorFn: (row) => row.placedAt,
    header: "Date",
    cell: ({ row }) => formatOrderDate(row.original.placedAt),
  },
];

export function OrdersTable({
  orders,
  sorting,
  onSort,
}: {
  orders: OrderSummary[];
  sorting: SortingState;
  onSort: (value: string) => void;
}) {
  return (
    <DataTable
      columns={columns}
      data={orders}
      ariaLabel="Liste des commandes"
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

function OrderItemsPreview({ order }: { order: OrderSummary }) {
  const preview = order.itemPreviews?.[0];
  const itemCount = order.itemCount ?? order.itemPreviews?.length ?? 0;

  return (
    <div className="flex min-w-32 items-center gap-2">
      {preview && (
        <OrderProductImage
          imageUrl={preview.imageUrl}
          productName={preview.productName}
          className="size-9"
        />
      )}
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        {itemCount} {itemCount > 1 ? "articles" : "article"}
      </span>
    </div>
  );
}
