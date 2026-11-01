import { ImportResultAlert } from "../components/ImportResultAlert";
import { useSearchParams } from "react-router";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import {
  ListSearchInput,
  ListSelectFilter,
} from "@/shared/components/ListFilters";
import { ListFilterPopover } from "@/shared/components/ListFilterPopover";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { useImportRequests, useRequests } from "../hooks/useQuoteRequests";
import { requestStatusLabels } from "../model/types";
import { QuoteRequestsTable } from "../components/QuoteRequestsTable";
export function QuoteRequestsPage() {
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get("page") ?? 0);
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const search = params.get("search") ?? "";
  const sort =
    params.get("sort") === "receivedAt,asc"
      ? "receivedAt,asc"
      : "receivedAt,desc";
  const rawStatus = params.get("status") ?? "";
  const status = rawStatus in requestStatusLabels ? rawStatus : "";
  const query = useRequests({ page, search, sort, status });
  const importer = useImportRequests();
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Demandes de soumission</h1>
          <p className="text-sm text-muted-foreground">
            Réception et qualification des besoins clients avant la création
            d’un devis.
          </p>
        </div>
        <Button disabled={importer.isPending} onClick={() => importer.mutate()}>
          {importer.isPending && <Spinner />}
          {importer.isPending ? "Importation…" : "Importer les demandes"}
        </Button>
      </div>
      {importer.isError && (
        <ApiErrorAlert
          title="Impossible d’importer les demandes."
          error={importer.error}
        />
      )}
      {importer.data && <ImportResultAlert result={importer.data} />}
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
        <ListSelectFilter
          label="Trier par"
          value={sort}
          onChange={(value) => change("sort", value)}
          options={[
            ["receivedAt,desc", "Plus récentes"],
            ["receivedAt,asc", "Plus anciennes"],
          ]}
        />
        <ListFilterPopover
          label="Filtres des demandes"
          count={Number(!!status)}
          onClear={() => change("status", "")}
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
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : query.isError ? (
        <ApiErrorAlert
          title="Impossible de charger les demandes."
          error={query.error}
        />
      ) : (
        query.data && (
          <div className="min-w-0 space-y-3">
            {query.data.content.length ? (
              <QuoteRequestsTable requests={query.data.content} />
            ) : (
              <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                Aucune demande ne correspond aux filtres sélectionnés.
              </div>
            )}
            <nav aria-label="Pagination des demandes">
              <PageNavigator
                page={page + 1}
                totalPages={Math.ceil(query.data.totalElements / 20)}
                goToPreviousPage={() => change("page", String(page - 1))}
                goToNextPage={() => change("page", String(page + 1))}
              />
            </nav>
          </div>
        )
      )}
    </div>
  );
}
