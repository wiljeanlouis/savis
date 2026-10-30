import { Button } from "@/shared/ui/button";
import { Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Spinner } from "@/shared/ui/spinner";
import { Switch } from "@/shared/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import {
  resourceCategories,
  type MaterialResource,
  type ResourceSort,
} from "../types";

type ResourceTableMeta = {
  changingStatus: boolean;
  changingStatusId?: string;
  onEdit: (resource: MaterialResource) => void;
  onOffers: (resource: MaterialResource) => void;
  onChangeStatus: (resource: MaterialResource) => void;
};
const columns: ColumnDef<MaterialResource>[] = [
  {
    id: "name",
    accessorFn: (row) => row.name,
    header: "Ressource",
    cell: ({ row }) => {
      const resource = row.original;
      return (
        <div className="whitespace-normal">
          <span className="block max-w-72 truncate font-medium">
            {resource.name}
          </span>
          <p className="max-w-72 truncate text-muted-foreground">
            {resource.description}
          </p>
        </div>
      );
    },
  },
  {
    id: "category",
    accessorFn: (row) => row.category,
    header: "Catégorie",
    cell: ({ row }) => {
      const resource = row.original;
      return <>{resourceCategories[resource.category]}</>;
    },
  },
  {
    id: "referenceUnit",
    accessorFn: (row) => row.referenceUnit,
    header: "Unité",
    cell: ({ row }) => {
      const resource = row.original;
      return <>{resource.referenceUnit ?? "—"}</>;
    },
  },
  {
    id: "status",
    header: "Statut",
    enableSorting: false,
    cell: ({ row, table }) => {
      const resource = row.original;
      const { changingStatus, changingStatusId, onChangeStatus } = table.options
        .meta as ResourceTableMeta;
      return (
        <div className="whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Switch
              checked={resource.status === "ACTIVE"}
              disabled={changingStatus}
              aria-label={`${resource.status === "ACTIVE" ? "Désactiver" : "Activer"} ${resource.name}`}
              onCheckedChange={() => onChangeStatus(resource)}
            />
            {changingStatus && changingStatusId === resource.id && (
              <Spinner
                role="status"
                aria-label={`Mise à jour du statut de ${resource.name}`}
              />
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row, table }) => {
      const resource = row.original;
      const { onEdit, onOffers } = table.options.meta as ResourceTableMeta;
      return (
        <>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOffers(resource)}
            >
              Offres
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Modifier"
                  onClick={() => onEdit(resource)}
                >
                  <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Modifier</TooltipContent>
            </Tooltip>
          </div>
        </>
      );
    },
  },
];
export function ResourcesTable({
  resources,
  changingStatus,
  changingStatusId,
  onEdit,
  onOffers,
  onChangeStatus,
  sort = "name,asc",
  onSort,
}: {
  resources: MaterialResource[];
  sort?: ResourceSort;
  onSort?: (sort: ResourceSort) => void;
  changingStatus: boolean;
  changingStatusId?: string;
  onEdit: (resource: MaterialResource) => void;
  onOffers: (resource: MaterialResource) => void;
  onChangeStatus: (resource: MaterialResource) => void;
}) {
  const [id, direction] = sort.split(",");
  const sorting: SortingState = [{ id, desc: direction === "desc" }];
  return (
    <DataTable
      columns={columns}
      data={resources}
      sorting={sorting}
      onSortingChange={(updater) => {
        const next = typeof updater === "function" ? updater(sorting) : updater;
        if (next[0])
          onSort?.(
            `${next[0].id},${next[0].desc ? "desc" : "asc"}` as ResourceSort,
          );
      }}
      ariaLabel="Liste des ressources"
      showPagination={false}
      getRowId={(row) => row.id}
      meta={{
        changingStatus,
        changingStatusId,
        onEdit,
        onOffers,
        onChangeStatus,
      }}
    />
  );
}
