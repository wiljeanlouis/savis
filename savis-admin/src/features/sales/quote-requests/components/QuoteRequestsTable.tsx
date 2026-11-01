import { Link } from "react-router";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { formatOrderDate } from "../../orders/types";
import type { QuoteRequest } from "../model/types";
import { QuoteRequestStatusBadge } from "./QuoteRequestStatusBadge";
export function QuoteRequestsTable({ requests }: { requests: QuoteRequest[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Reçue le</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="w-0 text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.publicId}>
            <TableCell>
              <Link
                className="font-semibold text-primary hover:underline"
                to={`/sales/quote-requests/${request.publicId}`}
              >
                {request.customerName}
              </Link>
            </TableCell>
            <TableCell>{formatOrderDate(request.receivedAt)}</TableCell>
            <TableCell>
              <QuoteRequestStatusBadge status={request.status} />
            </TableCell>
            <TableCell className="text-right">
              <Button asChild variant="outline" size="sm">
                <Link
                  aria-label={`Consulter la demande de ${request.customerName}`}
                  to={`/sales/quote-requests/${request.publicId}`}
                >
                  Consulter
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
