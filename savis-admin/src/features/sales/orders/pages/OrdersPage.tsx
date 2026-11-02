import { NoData } from "@/shared/components/NoData";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { OrdersTable } from "../components/OrdersTable";
import { useOrderManagement } from "../hooks/useOrderManagement";
import { useSalesList } from "../../hooks/useSalesList";
import { orderSourceLabels, orderStatusLabels } from "../types";
import type { OrderSummary } from "../types";
import {
  ListSearchInput,
  ListSelectFilter,
} from "@/shared/components/ListFilters";
import { ListFilterPopover } from "@/shared/components/ListFilterPopover";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageSelector } from "@/shared/components/PageSelector";

export function OrdersPage() {
  const { orders, isLoading, isError, error, isImporting, retrieveWebOrders } =
    useOrderManagement();
  const list = useSalesList(orders, {
    searchableText: (order) =>
      `${order.orderNumber} ${order.customerName} ${order.customerPhone} ${orderSourceLabels[order.source]}`,
    sortValue: orderSortValue,
    sortColumns: [
      "orderNumber",
      "itemCount",
      "customerName",
      "customerPhone",
      "totalCents",
      "source",
      "status",
      "placedAt",
    ],
    defaultSort: "placedAt-desc",
    matchesFilters: (order, params) =>
      (!params.get("status") || order.status === params.get("status")) &&
      (!params.get("source") || order.source === params.get("source")),
  });
  const filterCount =
    Number(!!list.params.get("status")) + Number(!!list.params.get("source"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Commandes</h1>
          <p className="text-sm text-muted-foreground">
            Saisie administrative et import manuel des commandes web.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/orders/new">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Nouvelle commande
            </Link>
          </Button>
          <Button
            disabled={isImporting}
            onClick={() => void retrieveWebOrders()}
          >
            {isImporting ? "Récupération…" : "Récupérer commandes web"}
          </Button>
        </div>
      </div>

      <section
        aria-label="Recherche et filtres des commandes"
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <ListSearchInput
          label="Rechercher une commande"
          placeholder="Rechercher par numéro, client ou téléphone"
          value={list.search}
          onChange={(value) => list.update("search", value)}
        />
        <ListFilterPopover
          label="Filtres des commandes"
          count={filterCount}
          onClear={() => list.clearFilters(["status", "source"])}
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
              ...Object.entries(orderStatusLabels),
            ]}
          />
          <ListSelectFilter
            inPanel
            label="Source"
            value={list.params.get("source") ?? "ALL"}
            onChange={(value) =>
              list.update("source", value === "ALL" ? "" : value)
            }
            options={[
              ["ALL", "Toutes les sources"],
              ...Object.entries(orderSourceLabels),
            ]}
          />
        </ListFilterPopover>
      </section>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : isError ? (
        <ApiErrorAlert
          title="Impossible de charger les commandes."
          error={error}
        />
      ) : orders.length === 0 ? (
        <NoData />
      ) : (
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PageItemCount itemName="commande" totalItems={list.totalItems} />
            <PageSelector
              pageSize={list.pageSize}
              onPageChange={(value) => list.update("size", String(value))}
            />
          </div>
          {list.totalItems > 0 ? (
            <OrdersTable
              orders={list.items}
              sorting={list.sorting}
              onSort={list.setSort}
            />
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
              Aucune commande ne correspond aux filtres sélectionnés.
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

function orderSortValue(order: OrderSummary, column: string) {
  switch (column) {
    case "orderNumber":
      return order.orderNumber;
    case "itemCount":
      return order.itemCount ?? order.itemPreviews?.length ?? 0;
    case "customerName":
      return order.customerName;
    case "customerPhone":
      return order.customerPhone;
    case "totalCents":
      return order.totalCents;
    case "source":
      return orderSourceLabels[order.source];
    case "status":
      return orderStatusLabels[order.status];
    default:
      return order.placedAt;
  }
}
