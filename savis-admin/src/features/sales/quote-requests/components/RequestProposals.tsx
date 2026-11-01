import { Link } from "react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/shared/ui/table";
import { Spinner } from "@/shared/ui/spinner";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { QuotationStatusBadge } from "../../quotations/components/QuotationStatusBadge";
import { formatOrderCurrency } from "../../orders/types";
import { formatDateOnly } from "../../quotations/components/QuotationsTable";
import { useProposals } from "../hooks/useQuoteRequests";
import type { QuoteRequest } from "../model/types";
import { ProposalForm } from "./ProposalForm";
export function RequestProposals({ request }: { request: QuoteRequest }) {
  const query = useProposals(request.publicId);
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Devis associés</CardTitle>
            <p className="mt-1 text-muted-foreground">
              Chaque proposition conserve ses propres prix et son statut.
            </p>
          </div>
          {request.status !== "CLOSED" && <ProposalForm request={request} />}
        </div>
      </CardHeader>
      <CardContent>
        {query.isError ? (
          <ApiErrorAlert
            title="Impossible de charger les devis."
            error={query.error}
          />
        ) : query.isPending ? (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : query.data?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Soumission</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead>Commande</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Link
                      className="font-semibold text-primary hover:underline"
                      to={`/quotations/${q.id}`}
                    >
                      {q.quotationNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <QuotationStatusBadge status={q.status} />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatOrderCurrency(q.totalCents)}
                  </TableCell>
                  <TableCell>{formatDateOnly(q.validUntil)}</TableCell>
                  <TableCell>
                    {q.convertedOrderId ? (
                      <Link
                        className="text-primary hover:underline"
                        to={`/orders/${q.convertedOrderId}`}
                      >
                        Voir la commande
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-6 text-center text-muted-foreground">
            Aucun devis créé.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
