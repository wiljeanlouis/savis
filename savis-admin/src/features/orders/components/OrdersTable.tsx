import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Spinner } from "@/shared/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Download01Icon, Pdf01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import type { OrderDocumentType, OrderSummary } from "../types";
import { formatPhoneForDisplay, phoneHref } from "../model/contactFormat";
import {
  formatOrderCurrency,
  formatOrderDate,
  orderSourceLabels,
} from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderProductImage } from "./OrderProductImage";

export function OrdersTable({
  orders,
  downloadingOrderId,
  onDownloadDocument,
}: {
  orders: OrderSummary[];
  downloadingOrderId?: string;
  onDownloadDocument: (
    orderId: string,
    documentType: OrderDocumentType,
  ) => void;
}) {
  return (
    <Card>
      <CardContent className="px-0">
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
              <TableHead className="w-0 text-right">
                <span className="sr-only">Documents</span>
              </TableHead>
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
                <TableCell className="text-right">
                  <OrderDocumentMenu
                    order={order}
                    isDownloading={downloadingOrderId === order.id}
                    onDownload={onDownloadDocument}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function OrderDocumentMenu({
  order,
  isDownloading,
  onDownload,
}: {
  order: OrderSummary;
  isDownloading: boolean;
  onDownload: (orderId: string, documentType: OrderDocumentType) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDownloading}
          aria-label={`Documents PDF de ${order.orderNumber}`}
        >
          {isDownloading ? (
            <Spinner />
          ) : (
            <HugeiconsIcon icon={Pdf01Icon} strokeWidth={2} />
          )}
          PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem onClick={() => onDownload(order.id, "quote")}>
          <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
          Télécharger la soumission
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload(order.id, "invoice")}>
          <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
          Télécharger la facture
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
