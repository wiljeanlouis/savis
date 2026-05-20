import { NoData } from "@/shared/components/NoData";
import { DataTable } from "@/shared/components/DataTable";
import { Badge } from "@/shared/ui/badge";
import { Spinner } from "@/shared/ui/spinner";
import type {
  ColumnDef,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";
import type { SavisTask, SavisTaskStatus } from "../types";
import { useGetTasks } from "../hooks/useTaskApi";

const statusVariant: Record<
  SavisTaskStatus,
  "default" | "secondary" | "destructive"
> = {
  IN_PROGRESS: "secondary",
  COMPLETED: "default",
  FAILED: "destructive",
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
    cell: ({ row }) => <div className="font-medium">{row.original.type}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "payload",
    header: "Payload",
    cell: ({ row }) => (
      <div className="max-w-xs truncate">
        {JSON.stringify(row.original.payload)}
      </div>
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
      <div className="max-w-xs truncate">
        {row.original.error_message ?? "-"}
      </div>
    ),
    enableSorting: false,
  },
];

export const TaskList = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const currentSort = sorting[0];
  const { data, isPending, isError, error } = useGetTasks(
    page,
    pageSize,
    currentSort?.id,
    currentSort ? (currentSort.desc ? "desc" : "asc") : undefined,
  );

  const handlePageSizeChange = (size: number) => {
    setPage(1);
    setPageSize(size);
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting((currentSorting) => {
      const nextSorting =
        typeof updater === "function" ? updater(currentSorting) : updater;
      setPage(1);
      return nextSorting;
    });
  };

  if (isError) {
    const errorResponse = error as unknown as {
      response?: { data?: { detail?: string } };
    };
    toast.error("Une erreur est survenue lors de la récupération des tasks.", {
      description: errorResponse.response?.data?.detail,
    });
  }

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
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        onSortingChange={handleSortingChange}
      />
      <p className="text-xs text-muted-foreground">
        {data.total_items} task{data.total_items > 1 ? "s" : ""}
      </p>
    </>
  );
};
