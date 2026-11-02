import { NoData } from "@/shared/components/NoData";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { QuotationsTable } from "../components/QuotationsTable";
import {
  useQuotationDocumentPreview,
  useQuotations,
} from "../hooks/useQuotationApi";
import { useSalesList } from "../../hooks/useSalesList";
import { quotationStatusLabels, type Quotation } from "../types";
import {
  ListSearchInput,
  ListSelectFilter,
} from "@/shared/components/ListFilters";
import { ListFilterPopover } from "@/shared/components/ListFilterPopover";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageSelector } from "@/shared/components/PageSelector";

/** Displays all standalone commercial quotations. */
export function QuotationsPage() {
  const query = useQuotations();
  const documents = useQuotationDocumentPreview();
  const quotations = query.data ?? [];
  const list = useSalesList(quotations, {
    searchableText: (quotation) =>
      `${quotation.quotationNumber} ${quotation.customerName} ${quotation.customerPhone} ${quotation.customerEmail ?? ""}`,
    sortValue: quotationSortValue,
    sortColumns: [
      "quotationNumber",
      "customerName",
      "customerPhone",
      "itemCount",
      "totalCents",
      "validUntil",
      "status",
      "createdAt",
    ],
    defaultSort: "createdAt-desc",
    matchesFilters: (quotation, params) =>
      !params.get("status") || quotation.status === params.get("status"),
  });
  const filterCount = Number(!!list.params.get("status"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Soumissions</h1>
          <p className="text-sm text-muted-foreground">
            Préparez et suivez les offres commerciales avant la commande.
          </p>
        </div>
        <Button asChild>
          <Link to="/quotations/new">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Nouvelle soumission
          </Link>
        </Button>
      </div>

      <section
        aria-label="Recherche et filtres des soumissions"
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <ListSearchInput
          label="Rechercher une soumission"
          placeholder="Rechercher par numéro, client ou téléphone"
          value={list.search}
          onChange={(value) => list.update("search", value)}
        />
        <ListFilterPopover
          label="Filtres des soumissions"
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
              ...Object.entries(quotationStatusLabels),
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
          title="Impossible de charger les soumissions."
          error={query.error}
        />
      ) : quotations.length === 0 ? (
        <NoData />
      ) : (
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PageItemCount itemName="soumission" totalItems={list.totalItems} />
            <PageSelector
              pageSize={list.pageSize}
              onPageChange={(value) => list.update("size", String(value))}
            />
          </div>
          {list.totalItems > 0 ? (
            <QuotationsTable
              quotations={list.items}
              sorting={list.sorting}
              onSort={list.setSort}
              openingQuotationId={
                documents.isPending ? documents.pendingQuotationId : undefined
              }
              onOpen={(id) => void documents.open(id)}
            />
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
              Aucune soumission ne correspond aux filtres sélectionnés.
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

function quotationSortValue(quotation: Quotation, column: string) {
  switch (column) {
    case "quotationNumber":
      return quotation.quotationNumber;
    case "customerName":
      return quotation.customerName;
    case "customerPhone":
      return quotation.customerPhone;
    case "itemCount":
      return quotation.items.length;
    case "totalCents":
      return quotation.totalCents;
    case "validUntil":
      return quotation.validUntil;
    case "status":
      return quotationStatusLabels[quotation.status];
    default:
      return quotation.createdAt;
  }
}
