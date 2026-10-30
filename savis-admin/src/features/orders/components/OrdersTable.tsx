import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Link } from "react-router";
import type { OrderSummary } from "../types";
import { formatPhoneForDisplay, phoneHref } from "../model/contactFormat";
import {
  formatOrderCurrency,
  formatOrderDate,
  orderSourceLabels,
} from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderProductImage } from "./OrderProductImage";

export function OrdersTable({ orders }: { orders: OrderSummary[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Commande</TableHead>
          <TableHead>Articles</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Téléphone</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <Link
                className="font-semibold text-primary hover:underline"
                to={`/orders/${order.id}`}
              >
                {order.orderNumber}
              </Link>
            </TableCell>
            <TableCell>
              <OrderItemsPreview order={order} />
            </TableCell>
            <TableCell>{order.customerName}</TableCell>
            <TableCell>
              <a
                className="hover:underline"
                href={`tel:${phoneHref(order.customerPhone)}`}
              >
                {formatPhoneForDisplay(order.customerPhone)}
              </a>
            </TableCell>
            <TableCell className="font-medium">
              {formatOrderCurrency(order.totalCents)}
            </TableCell>
            <TableCell>{orderSourceLabels[order.source]}</TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell>{formatOrderDate(order.placedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
