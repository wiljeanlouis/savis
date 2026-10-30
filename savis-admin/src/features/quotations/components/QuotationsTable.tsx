import {
  formatPhoneForDisplay,
  phoneHref,
} from "@/features/orders/model/contactFormat";
import { formatOrderCurrency, formatOrderDate } from "@/features/orders/types";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { FileViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import type { Quotation } from "../types";
import { QuotationStatusBadge } from "./QuotationStatusBadge";

/** Lists quotation commercial data and document actions. */
export function QuotationsTable({
  quotations,
  openingQuotationId,
  onOpen,
}: {
  quotations: Quotation[];
  openingQuotationId?: string;
  onOpen: (quotationId: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Soumission</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Téléphone</TableHead>
          <TableHead>Articles</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Validité</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Créée</TableHead>
          <TableHead className="w-0 text-right">
            <span className="sr-only">Document</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotations.map((quotation) => (
          <TableRow key={quotation.id}>
            <TableCell>
              <Link
                className="font-semibold text-primary hover:underline"
                to={`/quotations/${quotation.id}`}
              >
                {quotation.quotationNumber}
              </Link>
            </TableCell>
            <TableCell>{quotation.customerName}</TableCell>
            <TableCell>
              <a
                className="hover:underline"
                href={`tel:${phoneHref(quotation.customerPhone)}`}
              >
                {formatPhoneForDisplay(quotation.customerPhone)}
              </a>
            </TableCell>
            <TableCell>{quotation.items.length}</TableCell>
            <TableCell className="font-medium">
              {formatOrderCurrency(quotation.totalCents)}
            </TableCell>
            <TableCell>{formatDateOnly(quotation.validUntil)}</TableCell>
            <TableCell>
              <QuotationStatusBadge status={quotation.status} />
            </TableCell>
            <TableCell>{formatOrderDate(quotation.createdAt)}</TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={openingQuotationId === quotation.id}
                onClick={() => onOpen(quotation.id)}
                aria-label={`Ouvrir ${quotation.quotationNumber} dans un nouvel onglet`}
              >
                {openingQuotationId === quotation.id ? (
                  <Spinner />
                ) : (
                  <HugeiconsIcon icon={FileViewIcon} strokeWidth={2} />
                )}
                Voir PDF
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`),
  );
}
