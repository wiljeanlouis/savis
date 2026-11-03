import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Spinner } from "@/shared/ui/spinner";
import { InvoicesTable } from "../components/InvoicesTable";
import { useInvoiceDocumentPreview, useInvoices } from "../hooks/useInvoiceApi";
import { invoiceDisplayNumber, invoiceStatusLabels } from "../types";
import { useSalesList } from "../../hooks/useSalesList";
import type { Invoice } from "../types";
import {
  ListSearchInput,
  ListSelectFilter,
} from "@/shared/components/ListFilters";
import { ListFilterPopover } from "@/shared/components/ListFilterPopover";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageSelector } from "@/shared/components/PageSelector";

/** Lists persisted commercial invoices independently from orders. */
export function InvoicesPage() {
  const query = useInvoices();
  const documents = useInvoiceDocumentPreview();
  const invoices = query.data ?? [];
  const list = useSalesList(invoices, {
    searchableText: (invoice) =>
      `${invoiceDisplayNumber(invoice)} ${invoice.sourceOrderNumber} ${invoice.customerName} ${invoice.customerPhone} ${invoice.customerEmail ?? ""}`,
    sortValue: invoiceSortValue,
    sortColumns: [
      "invoiceNumber",
      "sourceOrderNumber",
      "customerName",
      "customerPhone",
      "totalCents",
      "status",
      "createdAt",
    ],
    defaultSort: "createdAt-desc",
    matchesFilters: (invoice, params) =>
      !params.get("status") || invoice.status === params.get("status"),
  });
  const filterCount = Number(!!list.params.get("status"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Factures</h1>
          <p className="text-sm text-muted-foreground">
            Consultez, émettez et annulez les factures créées depuis les
            commandes acceptées.
          </p>
        </div>
      </div>

      <section
        aria-label="Recherche et filtres des factures"
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <ListSearchInput
          label="Rechercher une facture"
          placeholder="Rechercher par numéro, client ou commande"
          value={list.search}
          onChange={(value) => list.update("search", value)}
        />
        <ListFilterPopover
          label="Filtres des factures"
          count={filterCount}
          onClear={() => list.clearFilters(["status"])}
        >
          <ListSelectFilter
            inPanel
            label="Statut"
            value={list.params.get("status") ?? "ALL"}
            onChange={(value) =>
              list.update("status", value === "ALL" ? "" : value)
            }
            options={[
              ["ALL", "Tous les statuts"],
              ...Object.entries(invoiceStatusLabels),
            ]}
          />
        </ListFilterPopover>
      </section>

      {query.isPending ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : query.isError ? (
        <ApiErrorAlert
          title="Impossible de charger les factures."
          error={query.error}
        />
      ) : (
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PageItemCount itemName="facture" totalItems={list.totalItems} />
            <PageSelector
              pageSize={list.pageSize}
              onPageChange={(value) => list.update("size", String(value))}
            />
          </div>
          {invoices.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
              Aucune facture dans le registre.
            </div>
          ) : list.totalItems > 0 ? (
            <InvoicesTable
              invoices={list.items}
              sorting={list.sorting}
              onSort={list.setSort}
              openingInvoiceId={
                documents.isPending ? documents.pendingInvoiceId : undefined
              }
              onOpen={(id) => void documents.open(id)}
            />
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
              Aucune facture ne correspond aux filtres sélectionnés.
            </div>
          )}
          <PageNavigator
            page={list.page}
            totalPages={list.totalPages}
            goToPreviousPage={() => list.changePage(list.page - 1)}
            goToNextPage={() => list.changePage(list.page + 1)}
          />
        </div>
      )}
    </div>
  );
}

function invoiceSortValue(invoice: Invoice, column: string) {
  switch (column) {
    case "invoiceNumber":
      return invoiceDisplayNumber(invoice);
    case "sourceOrderNumber":
      return invoice.sourceOrderNumber;
    case "customerName":
      return invoice.customerName;
    case "customerPhone":
      return invoice.customerPhone;
    case "totalCents":
      return invoice.totalCents;
    case "status":
      return invoiceStatusLabels[invoice.status];
    default:
      return invoice.createdAt;
  }
}
