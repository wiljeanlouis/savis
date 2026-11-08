import { NoData } from "@/shared/components/NoData";
import { ListLoading } from "@/shared/components/ListLoading";
import { useSearchParams } from "react-router";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { SalesImportAlert } from "@/features/sales/components/SalesImportAlert";
import {
  ListSearchInput,
  ListSelectFilter,
} from "@/shared/components/ListFilters";
import { ListFilterPopover } from "@/shared/components/ListFilterPopover";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { PageSelector } from "@/shared/components/PageSelector";
import { useImportRequests, useRequests } from "../hooks/useQuoteRequests";
import { requestStatusLabels } from "../model/types";
import { QuoteRequestsTable } from "../components/QuoteRequestsTable";
import type { SortingState } from "@tanstack/react-table";
export function QuoteRequestsPage() {
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get("page") ?? 0);
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const rawSize = Number(params.get("size") ?? 20);
  const size = [10, 20, 50].includes(rawSize) ? rawSize : 20;
  const search = params.get("search") ?? "";
  const validSorts = [
    "customerName,asc",
    "customerName,desc",
    "receivedAt,asc",
    "receivedAt,desc",
    "status,asc",
    "status,desc",
  ];
  const sort = validSorts.includes(params.get("sort") ?? "")
    ? params.get("sort")!
    : "receivedAt,desc";
  const rawStatus = params.get("status") ?? "";
  const status = rawStatus in requestStatusLabels ? rawStatus : "";
  const query = useRequests({ page, size, search, sort, status });
  const importer = useImportRequests();
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "page") next.set("page", value);
    else next.delete("page");
    setParams(next);
  }
  const sorting: SortingState = [
    {
      id: sort.split(",")[0],
      desc: sort.endsWith(",desc"),
    },
  ];
  const onSort = (value: string) => {
    const [column, direction] = value.split("-");
    change("sort", `${column},${direction}`);
  };
  const filterCount = Number(!!status);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Demandes de soumission</h1>
          <p className="text-sm text-muted-foreground">
            Réception et qualification des besoins clients avant la création
            d’une soumission.
          </p>
        </div>
        <Button disabled={importer.isPending} onClick={() => importer.mutate()}>
          {importer.isPending && <Spinner />}
          {importer.isPending ? "Importation…" : "Importer les demandes"}
        </Button>
      </div>
      <SalesImportAlert
        requestResult={importer.data ?? null}
        requestError={importer.isError ? importer.error : null}
        orderResult={undefined}
        orderError={null}
      />
      <section
        aria-label="Filtres des demandes"
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <ListSearchInput
          label="Rechercher un client"
          placeholder="Rechercher par nom de client"
          maxLength={200}
          value={search}
          onChange={(value) => change("search", value)}
        />
        <ListFilterPopover
          label="Filtres des demandes"
          count={filterCount}
          onClear={() => {
            const next = new URLSearchParams(params);
            next.delete("status");
            next.set("page", "0");
            setParams(next);
          }}
        >
          <ListSelectFilter
            inPanel
            label="Statut"
            value={status || "ALL"}
            onChange={(value) => change("status", value === "ALL" ? "" : value)}
            options={[
              ["ALL", "Tous les statuts"],
              ...Object.entries(requestStatusLabels),
            ]}
          />
        </ListFilterPopover>
      </section>
      {query.isPending ? (
        <ListLoading message="Chargement des demandes…" />
      ) : query.isError ? (
        <ApiErrorAlert
          title="Impossible de charger les demandes."
          error={query.error}
        />
      ) : (
        query.data && (
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PageItemCount
                itemName="demande"
                totalItems={query.data.totalElements}
              />
              <PageSelector
                pageSize={size}
                onPageChange={(value) => change("size", String(value))}
              />
            </div>
            {query.data.content.length ? (
              <QuoteRequestsTable
                requests={query.data.content}
                sorting={sorting}
                onSort={onSort}
              />
            ) : (
              <NoData>
                Aucune demande ne correspond aux filtres sélectionnés.
              </NoData>
            )}
            <nav aria-label="Pagination des demandes">
              <PageNavigator
                page={page + 1}
                totalPages={Math.max(
                  1,
                  Math.ceil(query.data.totalElements / size),
                )}
                goToPreviousPage={() =>
                  change("page", String(Math.max(0, page - 1)))
                }
                goToNextPage={() => change("page", String(page + 1))}
              />
            </nav>
          </div>
        )
      )}
    </div>
  );
}
