import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Button } from "@/shared/ui/button";
import type { Bom } from "../types";
import { BomImage } from "./BomImage";
import { formatBomQuantity } from "../model/bomCostPresentation";
import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
type DetailsMeta = {
  selectedId?: string | null;
  onSelect: (id: string) => void;
};
const columns: ColumnDef<Bom>[] = [
  {
    id: "name",
    accessorFn: (row) => row.name,
    header: "Composition",
    cell: ({ row }) => {
      const b = row.original;
      return (
        <>
          <div className="flex items-center gap-3">
            <BomImage src={b.imageUrl} name={b.name} />
            <span className="max-w-72 whitespace-normal font-medium">
              {b.name}
            </span>
          </div>
        </>
      );
    },
  },
  {
    id: "type",
    accessorFn: (row) => row.type,
    header: "Type",
    cell: ({ row }) => {
      const b = row.original;
      return <>{b.type === "FOOD" ? "Alimentaire" : "Matériel"}</>;
    },
  },
  {
    id: "components",
    accessorFn: (row) => row.components.length,
    header: "Composants",
    cell: ({ row }) => {
      const b = row.original;
      return <>{b.components.length}</>;
    },
  },
  {
    id: "activities",
    accessorFn: (row) => row.activities.length,
    header: "Activités",
    cell: ({ row }) => {
      const b = row.original;
      return <>{b.activities.length}</>;
    },
  },
  {
    id: "yield",
    enableSorting: false,
    header: "Rendement",
    cell: ({ row }) => {
      const b = row.original;
      return <>{formatBomQuantity(b.yield.quantity, b.yield.unit)}</>;
    },
  },
  {
    id: "actions",
    enableSorting: false,
    header: "Actions",
    cell: ({ row, table }) => {
      const b = row.original;
      const { selectedId, onSelect } = table.options.meta as DetailsMeta;
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            aria-label={`Détails de ${b.name}`}
            data-selected={selectedId === b.id}
            onClick={() => onSelect(b.id!)}
          >
            <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
            Détails
          </Button>
        </>
      );
    },
  },
];
export function BomDataTable({
  items,
  selectedId,
  params,
  onSort,
  onSelect,
}: {
  items: Bom[];
  selectedId?: string | null;
  params: URLSearchParams;
  onSort: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  const sort = params.get("sort") ?? "asc";
  const normalizedSort =
    sort === "asc" || sort === "desc" ? `name-${sort}` : sort;
  const sortValue = normalizedSort;
  const sorting: SortingState = [
    {
      id: sortValue.replace(/-(asc|desc)$/, ""),
      desc: sortValue.endsWith("-desc"),
    },
  ];
  return (
    <DataTable
      columns={columns}
      data={items}
      ariaLabel="Liste des compositions"
      showPagination={false}
      sorting={sorting}
      columnAlignments={{
        components: "right",
        activities: "right",
        yield: "right",
      }}
      meta={{ selectedId, onSelect }}
      getRowId={(row) => row.id!}
      isRowSelected={(row) => row.id === selectedId}
      onSortingChange={(updater) => {
        const next = typeof updater === "function" ? updater(sorting) : updater;
        if (next[0]) onSort(`${next[0].id}-${next[0].desc ? "desc" : "asc"}`);
      }}
    />
  );
}
