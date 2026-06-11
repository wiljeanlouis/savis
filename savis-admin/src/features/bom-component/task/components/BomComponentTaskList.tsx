import { NoData } from "@/shared/components/NoData";
import { DataTable } from "@/shared/components/DataTable";
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
import type { SavisTask, SavisTaskStatus } from "../types";
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
  const { data, isPending, isError, error } = useGetBomComponentTasks(
    page,
    pageSize,
    currentSort?.id,
    currentSort ? (currentSort.desc ? "desc" : "asc") : undefined,
  );

  useEffect(() => {
    if (!isError) {
      return;
    }

    const errorResponse = error as unknown as {
      response?: { data?: { detail?: string } };
    };
    toast.error("Une erreur est survenue lors de la récupération des tâches.", {
      description: errorResponse.response?.data?.detail,
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

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data?.items.length) {
    return <NoData />;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data.items}
        page={data.page}
        pageSize={data.size}
        totalPages={data.total_pages}
        sorting={sorting}
        onPageChange={(nextPage) => updateSearchParams({ page: `${nextPage}` })}
        onPageSizeChange={handlePageSizeChange}
        onSortingChange={handleSortingChange}
      />
      <p className="text-xs text-muted-foreground">
        {data.total_items} tâche{data.total_items > 1 ? "s" : ""}
      </p>
    </>
  );
};
