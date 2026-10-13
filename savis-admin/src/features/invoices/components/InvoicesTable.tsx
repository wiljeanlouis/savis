import {
  formatPhoneForDisplay,
  phoneHref,
} from "@/features/orders/model/contactFormat";
import { formatOrderCurrency, formatOrderDate } from "@/features/orders/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import type { Invoice } from "../types";
import { invoiceDisplayNumber } from "../types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

export function InvoicesTable({
  invoices,
  downloadingInvoiceId,
  onDownload,
}: {
  invoices: Invoice[];
  downloadingInvoiceId?: string;
  onDownload: (invoiceId: string) => void;
}) {
  return (
    <Card>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facture</TableHead>
              <TableHead>Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créée</TableHead>
              <TableHead className="w-0 text-right">
                <span className="sr-only">Document</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Link
                    className="font-semibold text-primary hover:underline"
                    to={`/invoices/${invoice.id}`}
                  >
                    {invoiceDisplayNumber(invoice)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    className="hover:underline"
                    to={`/orders/${invoice.sourceOrderId}`}
                  >
                    {invoice.sourceOrderNumber}
                  </Link>
                </TableCell>
                <TableCell>{invoice.customerName}</TableCell>
                <TableCell>
                  <a
                    className="hover:underline"
                    href={`tel:${phoneHref(invoice.customerPhone)}`}
                  >
                    {formatPhoneForDisplay(invoice.customerPhone)}
                  </a>
                </TableCell>
                <TableCell className="font-medium">
                  {formatOrderCurrency(invoice.totalCents)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell>{formatOrderDate(invoice.createdAt)}</TableCell>
                <TableCell className="text-right">
                  {invoice.invoiceNumber ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={downloadingInvoiceId === invoice.id}
                      onClick={() => onDownload(invoice.id)}
                    >
                      {downloadingInvoiceId === invoice.id ? (
                        <Spinner />
                      ) : (
                        <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
                      )}
                      PDF
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
