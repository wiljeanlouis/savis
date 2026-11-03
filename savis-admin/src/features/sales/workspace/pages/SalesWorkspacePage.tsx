import { ImportResultAlert } from "@/features/sales/quote-requests/components/ImportResultAlert";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { Link, useLocation, useParams } from "react-router";
import { SalesWorkspaceDossier } from "../components/SalesWorkspaceDossier";
import { SalesWorkspaceFilters } from "../components/SalesWorkspaceFilters";
import { SalesWorkspaceList } from "../components/SalesWorkspaceList";
import { useSalesWorkspace } from "../hooks/useSalesWorkspace";
import { useSalesWorkspaceDossier } from "../hooks/useSalesWorkspaceDossier";
import { useOrderManagement } from "@/features/sales/orders/hooks/useOrderManagement";

export function SalesWorkspacePage() {
  const location = useLocation();
  const { isImporting, retrieveWebOrders } = useOrderManagement();
  const {
    page,
    size,
    search,
    filter,
    query,
    importer,
    importResult,
    updateQueryParam,
    goToPage,
    resetFilters,
    startImport,
  } = useSalesWorkspace();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dossiers commerciaux
          </h1>
          <p className="text-sm text-muted-foreground">
            Retrouvez les demandes, soumissions, commandes et factures liées.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={importer.isPending} onClick={startImport}>
            {importer.isPending ? <Spinner /> : null}
            {importer.isPending ? "Importation…" : "Importer les demandes"}
          </Button>
          <Button
            disabled={isImporting}
            onClick={() => void retrieveWebOrders()}
          >
            {isImporting ? <Spinner /> : null}
            {isImporting ? "Importation…" : "Importer commandes web"}
          </Button>
        </div>
      </div>

      {importer.isError && (
        <ApiErrorAlert
          title="Impossible d’importer les demandes."
          error={importer.error}
        />
      )}
      {importResult && <ImportResultAlert result={importResult} />}

      <SalesWorkspaceFilters
        search={search}
        filter={filter}
        onSearchChange={(value) => updateQueryParam("search", value)}
        onFilterChange={(value) => updateQueryParam("filter", value)}
      />

      {query.isPending ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : query.isError ? (
        <ApiErrorAlert
          title="Impossible de charger les dossiers commerciaux."
          error={query.error}
        />
      ) : (
        <SalesWorkspaceList
          data={query.data}
          page={page}
          size={size}
          locationSearch={location.search}
          onResetFilters={resetFilters}
          onPageChange={goToPage}
          onPageSizeChange={(nextSize) =>
            updateQueryParam("size", String(nextSize))
          }
        />
      )}
    </div>
  );
}

export function SalesWorkspaceDossierPage() {
  const { dossierId = "" } = useParams();
  const location = useLocation();
  const query = useSalesWorkspaceDossier(dossierId);

  if (query.isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <ApiErrorAlert
          title="Impossible de charger le dossier commercial."
          error={query.error}
        />
        <Button asChild variant="outline">
          <Link to={{ pathname: "/sales/workspace", search: location.search }}>
            Retour aux dossiers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <SalesWorkspaceDossier
      dossier={query.data}
      returnTo={`${location.pathname}${location.search}`}
      listSearch={location.search}
    />
  );
}
