import { importRequests } from "@/features/sales/quote-requests/api/quoteRequestApi";
import { ImportResultAlert } from "@/features/sales/quote-requests/components/ImportResultAlert";
import type { ImportResult } from "@/features/sales/quote-requests/model/types";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ListSearchInput } from "@/shared/components/ListFilters";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { Spinner } from "@/shared/ui/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router";
import {
  getSalesWorkspaceDossier,
  listSalesWorkspace,
  type SalesWorkspaceBranch,
} from "../api/workspaceApi";
import { formatOrderCurrency, formatOrderDate } from "../../orders/types";

const PAGE_SIZE = 10;
const FILTER_OPTIONS = [
  { value: "ALL", label: "Tous" },
  { value: "ACTION_REQUIRED", label: "À traiter" },
  { value: "FINISHED", label: "Terminés" },
] as const;

export function SalesWorkspacePage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const rawPage = Number(params.get("page") ?? 0);
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const rawSize = Number(params.get("size") ?? PAGE_SIZE);
  const size = Number.isInteger(rawSize) && rawSize > 0 ? rawSize : PAGE_SIZE;
  const search = params.get("search") ?? "";
  const filter = (params.get("filter") ?? "ALL") as
    | "ALL"
    | "ACTION_REQUIRED"
    | "FINISHED";
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const query = useQuery({
    queryKey: ["sales", "workspace", { page, size, search, filter }],
    queryFn: () => listSalesWorkspace({ page, size, search, filter }),
  });

  const importer = useMutation({
    mutationFn: importRequests,
    onSuccess: async (result) => {
      setImportResult(result);
      await queryClient.invalidateQueries({ queryKey: ["sales", "workspace"] });
      await queryClient.invalidateQueries({ queryKey: ["quote-requests"] });
    },
  });

  function updateQueryParam(
    key: string,
    value: string | undefined,
    resetPage = true,
  ) {
    const next = new URLSearchParams(params);
    if (value && value.trim().length > 0) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (resetPage) next.delete("page");
    setParams(next);
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(Math.max(0, nextPage)));
    setParams(next);
  }

  function resetFilters() {
    setParams(new URLSearchParams());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Espace commercial
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dossiers commerciaux
          </h1>
          <p className="text-sm text-muted-foreground">
            Retrouvez les demandes, soumissions, commandes et factures liées.
          </p>
        </div>
        <Button
          disabled={importer.isPending}
          onClick={() => {
            setImportResult(null);
            importer.mutate();
          }}
        >
          {importer.isPending ? <Spinner /> : null}
          {importer.isPending ? "Importation…" : "Importer les demandes"}
        </Button>
      </div>

      {importer.isError && (
        <ApiErrorAlert
          title="Impossible d’importer les demandes."
          error={importer.error}
        />
      )}
      {importResult && <ImportResultAlert result={importResult} />}

      <section
        aria-label="Recherche et filtres des dossiers"
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="w-full max-w-xl sm:flex-1">
          <ListSearchInput
            label="Rechercher un client ou une référence"
            value={search}
            maxLength={200}
            onChange={(value) => updateQueryParam("search", value)}
            placeholder="Rechercher un client ou une référence"
          />
        </div>

        <div aria-label="Filtrer les dossiers" className="flex shrink-0 gap-2">
          <Tabs
            value={filter}
            onValueChange={(nextFilter) =>
              updateQueryParam("filter", nextFilter, true)
            }
            className="w-auto"
          >
            <TabsList className="h-9">
              {FILTER_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

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
        <Card>
          <CardHeader>
            <CardTitle>Dossiers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {query.data.content.length === 0 ? (
              <div className="space-y-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun dossier ne correspond aux critères actuels.
                </p>
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              query.data.content.map((dossier) => (
                <article
                  key={dossier.id}
                  className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <Link
                      className="font-medium hover:underline"
                      to={{
                        pathname: `/sales/workspace/${encodeURIComponent(dossier.id)}`,
                        search: location.search,
                      }}
                    >
                      {dossier.customerName}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {dossier.reference}
                      {dossier.description ? ` · ${dossier.description}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 text-sm md:items-end">
                    <span>{dossier.situation}</span>
                    <span className="text-muted-foreground">
                      {dossier.lastActivity
                        ? `Dernière activité · ${formatOrderDate(dossier.lastActivity)}`
                        : "Aucune activité datée"}
                    </span>
                  </div>
                  <Button asChild variant="outline">
                    <Link
                      to={{
                        pathname: `/sales/workspace/${encodeURIComponent(dossier.id)}`,
                        search: location.search,
                      }}
                    >
                      Ouvrir le dossier
                    </Link>
                  </Button>
                </article>
              ))
            )}
            <nav aria-label="Pagination des dossiers">
              <PageNavigator
                page={page + 1}
                totalPages={Math.max(query.data.totalPages, 1)}
                goToPreviousPage={() => goToPage(page - 1)}
                goToNextPage={() => goToPage(page + 1)}
                pageSize={size}
                onPageSizeChange={(nextSize) => {
                  const next = new URLSearchParams(params);
                  next.set("size", String(nextSize));
                  next.delete("page");
                  setParams(next);
                }}
                pageSizeOptions={[10, 20, 50]}
              />
            </nav>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function SalesWorkspaceDossierPage() {
  const { dossierId = "" } = useParams();
  const location = useLocation();
  const query = useQuery({
    queryKey: ["sales", "workspace", "dossier", dossierId],
    queryFn: () => getSalesWorkspaceDossier(dossierId),
    enabled: Boolean(dossierId),
  });

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

  const dossier = query.data;
  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-muted-foreground hover:underline"
          to={{ pathname: "/sales/workspace", search: location.search }}
        >
          ← Tous les dossiers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{dossier.customerName}</h1>
        <p className="text-sm text-muted-foreground">
          {dossier.reference}
          {dossier.description ? ` · ${dossier.description}` : ""}
        </p>
        <p className="mt-2">{dossier.situation}</p>
        {dossier.lastActivity && (
          <p className="text-sm text-muted-foreground">
            Dernière activité · {formatOrderDate(dossier.lastActivity)}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parcours commercial</CardTitle>
        </CardHeader>
        <CardContent>
          <Branch
            branch={dossier.root}
            returnTo={`${location.pathname}${location.search}`}
            depth={0}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Branch({
  branch,
  returnTo,
  depth,
}: {
  branch: SalesWorkspaceBranch;
  returnTo: string;
  depth: number;
}) {
  const label = documentLabels[branch.type];
  const row = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Link
          className="font-medium hover:underline"
          to={withReturnTo(branch.actionUrl, returnTo)}
        >
          {branch.reference}
        </Link>
        <p className="text-sm text-muted-foreground">
          {statusLabels[branch.type][branch.status] ?? "Statut indisponible"}
          {branch.type === "INVOICE" && branch.paymentStatus
            ? ` · ${paymentStatusLabels[branch.paymentStatus] ?? branch.paymentStatus}`
            : ""}
          {branch.amountCents !== null
            ? ` · ${formatOrderCurrency(branch.amountCents)}`
            : ""}
          {branch.lastActivity
            ? ` · ${formatOrderDate(branch.lastActivity)}`
            : ""}
        </p>
        {branch.warnings.map((warning) => (
          <p key={warning} className="mt-1 text-sm text-destructive">
            {warning}
          </p>
        ))}
      </div>
      {branch.action && branch.actionUrl && (
        <Button asChild variant="outline" className="self-start">
          <Link to={withReturnTo(branch.actionUrl, returnTo)}>
            {branch.action}
          </Link>
        </Button>
      )}
    </div>
  );

  if (branch.children.length === 0) {
    return (
      <div
        className="border-l py-3 pl-4"
        style={{ marginLeft: `${depth * 1.25}rem` }}
      >
        {row}
      </div>
    );
  }

  return (
    <Collapsible defaultOpen>
      <section
        className="border-l py-3 pl-4"
        style={{ marginLeft: `${depth * 1.25}rem` }}
      >
        <div className="flex items-start justify-between gap-3">
          {row}
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Afficher ou masquer les documents liés à ${branch.reference}`}
            >
              Parcours
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-2 space-y-1">
            {branch.children.map((child) => (
              <Branch
                key={`${child.type}:${child.id}`}
                branch={child}
                returnTo={returnTo}
                depth={depth + 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function withReturnTo(actionUrl: string | null, returnTo: string) {
  if (!actionUrl) return returnTo;
  const separator = actionUrl.includes("?") ? "&" : "?";
  return `${actionUrl}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

const documentLabels: Record<SalesWorkspaceBranch["type"], string> = {
  REQUEST: "Demande",
  QUOTATION: "Soumission",
  ORDER: "Commande",
  INVOICE: "Facture",
  PAYMENT: "Paiement",
};

const paymentStatusLabels: Record<string, string> = {
  UNPAID: "Non payée",
  PAID: "Payée",
};

const statusLabels: Record<
  SalesWorkspaceBranch["type"],
  Record<string, string>
> = {
  REQUEST: {
    RECEIVED: "Reçue",
    IN_PROGRESS: "En préparation",
    QUOTED: "Soumise",
    CLOSED: "Clôturée",
  },
  QUOTATION: {
    DRAFT: "Brouillon",
    SENT: "Envoyée",
    ACCEPTED: "Acceptée",
    REJECTED: "Refusée",
  },
  ORDER: {
    NEW: "Nouvelle",
    ACCEPTED: "Confirmée",
    IN_PREPARATION: "En préparation",
    READY: "Prête",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
    REJECTED: "Refusée",
  },
  INVOICE: {
    DRAFT: "Brouillon",
    ISSUED: "Émise",
    CANCELLED: "Annulée",
  },
  PAYMENT: {
    PAID: "Payée",
    UNPAID: "Non payée",
  },
};
