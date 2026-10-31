import { NoData } from "@/shared/components/NoData";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { useState } from "react";
import { InvoicesTable } from "../components/InvoicesTable";
import { useInvoiceDocumentPreview, useInvoices } from "../hooks/useInvoiceApi";
import type { InvoiceStatus } from "../types";
import { invoiceStatusLabels } from "../types";

const statuses: InvoiceStatus[] = ["DRAFT", "ISSUED", "CANCELLED"];

/** Lists persisted commercial invoices independently from orders. */
export function InvoicesPage() {
  const [status, setStatus] = useState<InvoiceStatus | undefined>();
  const query = useInvoices(status);
  const documents = useInvoiceDocumentPreview();
  const invoices = query.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Factures</h1>
          <p className="text-sm text-muted-foreground">
            Consultez, émettez et annulez les factures créées depuis les
            commandes acceptées.
          </p>
        </div>
        <div className="w-full sm:w-52">
          <Select
            value={status ?? "ALL"}
            onValueChange={(value) =>
              setStatus(value === "ALL" ? undefined : (value as InvoiceStatus))
            }
          >
            <SelectTrigger aria-label="Filtrer par statut" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              {statuses.map((value) => (
                <SelectItem key={value} value={value}>
                  {invoiceStatusLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.isPending ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : query.isError ? (
        <ApiErrorAlert
          title="Impossible de charger les factures."
          error={query.error}
        />
      ) : invoices.length === 0 ? (
        <NoData />
      ) : (
        <InvoicesTable
          invoices={invoices}
          openingInvoiceId={
            documents.isPending ? documents.pendingInvoiceId : undefined
          }
          onOpen={(id) => void documents.open(id)}
        />
      )}
    </div>
  );
}
