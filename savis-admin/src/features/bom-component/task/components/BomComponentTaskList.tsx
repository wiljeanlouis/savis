import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select";
import { getApiErrorMessage } from "@/shared/api/apiError";
import { DataTable } from "@/shared/components/DataTable";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageSelector } from "@/shared/components/PageSelector";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Spinner } from "@/shared/ui/spinner";
import type {
  ColumnDef,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import type { SavisTask, SavisTaskStatus, SavisTaskType } from "../types";
import { useGetBomComponentTasks } from "../hooks/useBomComponentTaskApi";

const statusVariant: Record<
  SavisTaskStatus,
  "default" | "secondary" | "destructive"
> = {
  IN_PROGRESS: "secondary",
  COMPLETED: "default",
  FAILED: "destructive",
};

const statusLabel: Record<SavisTaskStatus, string> = {
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  FAILED: "Échouée",
};

const taskTypeLabel: Record<SavisTask["type"], string> = {
  GET_OFFER: "Récupération",
  GET_OFFERS: "Recherche",
  REFRESH_OFFER: "Actualisation",
};

const parsePositiveInteger = (value: string | null, fallback: number) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
};

const formatDate = (date: string | null) => {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const columns: ColumnDef<SavisTask>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <div className="font-medium">{taskTypeLabel[row.original.type]}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>
        {statusLabel[row.original.status]}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "payload",
    header: "Paramètres",
    cell: ({ row }) => (
      <pre className="max-w-md whitespace-pre-wrap break-all font-mono text-xs">
        {JSON.stringify(row.original.payload, null, 2)}
      </pre>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: "Créée",
    cell: ({ row }) => formatDate(row.original.created_at),
    enableSorting: true,
  },
  {
    accessorKey: "updated_at",
    header: "Mise à jour",
    cell: ({ row }) => formatDate(row.original.updated_at),
    enableSorting: true,
  },
  {
    accessorKey: "error_message",
    header: "Erreur",
    cell: ({ row }) => (
      <div className="max-w-md whitespace-pre-wrap break-words">
        {row.original.error_message ?? "-"}
      </div>
    ),
    enableSorting: false,
  },
];

export const BomComponentTaskList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get("status") ?? "ALL";
  const status = Object.hasOwn(statusLabel, rawStatus)
    ? (rawStatus as SavisTaskStatus)
    : undefined;
  const rawType = searchParams.get("type") ?? "ALL";
  const type = Object.hasOwn(taskTypeLabel, rawType)
    ? (rawType as SavisTaskType)
    : undefined;
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const pageSize = parsePositiveInteger(searchParams.get("size"), 20);
  const sortBy = searchParams.get("sort_by") ?? "created_at";
  const sortDirection =
    searchParams.get("sort_direction") === "asc" ? "asc" : "desc";
  const sorting = useMemo<SortingState>(
    () => [{ id: sortBy, desc: sortDirection === "desc" }],
    [sortBy, sortDirection],
  );
  const currentSort = sorting[0];
  const { data, isPending, isError, error, refetch } = useGetBomComponentTasks(
    page,
    pageSize,
    currentSort?.id,
    currentSort ? (currentSort.desc ? "desc" : "asc") : undefined,
    status,
    type,
  );

  useEffect(() => {
    if (!isError) {
      return;
    }

    toast.error("Une erreur est survenue lors de la récupération des tâches.", {
      description: getApiErrorMessage(error),
    });
  }, [error, isError]);

  const updateSearchParams = (updates: Record<string, string>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(updates).forEach(([key, value]) => next.set(key, value));
      return next;
    });
  };

  const handlePageSizeChange = (size: number) => {
    updateSearchParams({ page: "1", size: `${size}` });
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const nextSorting =
      typeof updater === "function" ? updater(sorting) : updater;
    const nextSort = nextSorting[0] ?? {
      id: "created_at",
      desc: true,
    };

    updateSearchParams({
      page: "1",
      sort_by: nextSort.id,
      sort_direction: nextSort.desc ? "desc" : "asc",
    });
  };

  return (
    <div className="space-y-6">
      <section
        aria-label="Filtres des tâches"
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <div className="flex items-center gap-2">
          <Label
            htmlFor="task-status"
            className="whitespace-nowrap text-muted-foreground"
          >
            Filtrer par statut
          </Label>
          <Select
            value={status ?? "ALL"}
            onValueChange={(value) =>
              updateSearchParams({ status: value, page: "1" })
            }
          >
            <SelectTrigger
              id="task-status"
              className="flex-1 sm:w-48 sm:flex-none"
              aria-label="Statut des tâches"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              {Object.entries(statusLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="task-type"
            className="whitespace-nowrap text-muted-foreground"
          >
            Type de tâche
          </Label>
          <Select
            value={type ?? "ALL"}
            onValueChange={(value) =>
              updateSearchParams({ type: value, page: "1" })
            }
          >
            <SelectTrigger
              id="task-type"
              className="flex-1 sm:w-48 sm:flex-none"
              aria-label="Type de tâche"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              {Object.entries(taskTypeLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Actualiser
        </Button>
        <div className="flex items-center gap-2">
          <PageSelector
            pageSize={pageSize}
            onPageChange={handlePageSizeChange}
          />
        </div>
      </div>
      {isPending ? (
        <div
          className="flex min-h-64 items-center justify-center"
          aria-label="Chargement des tâches"
        >
          <Spinner />
        </div>
      ) : isError ? (
        <ApiErrorAlert
          title="Impossible de charger les tâches d'acquisition."
          error={error}
        >
          <Button variant="outline" onClick={() => void refetch()}>
            Réessayer
          </Button>
        </ApiErrorAlert>
      ) : !data?.items.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Aucune tâche ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <>
          <DataTable
            showPagination={false}
            columns={columns}
            data={data.items}
            page={data.page}
            pageSize={data.size}
            totalPages={data.total_pages}
            sorting={sorting}
            onPageChange={(nextPage) =>
              updateSearchParams({ page: `${nextPage}` })
            }
            onPageSizeChange={handlePageSizeChange}
            onSortingChange={handleSortingChange}
          />
          <PageNavigator
            itemName="tâche"
            totalItems={data.total_items}
            page={data.page}
            totalPages={data.total_pages}
            goToPreviousPage={() =>
              updateSearchParams({ page: String(data.page - 1) })
            }
            goToNextPage={() =>
              updateSearchParams({ page: String(data.page + 1) })
            }
          />
        </>
      )}
    </div>
  );
};
