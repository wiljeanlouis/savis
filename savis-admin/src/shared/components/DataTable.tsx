import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type TableMeta,
  type Row,
} from "@tanstack/react-table";

import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Sorting05Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/shared/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page?: number;
  pageSize?: number;
  totalPages?: number;
  sorting?: SortingState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortingChange?: OnChangeFn<SortingState>;
  emptyMessage?: string;
  showPagination?: boolean;
  ariaLabel?: string;
  meta?: TableMeta<TData>;
  getRowId?: (row: TData) => string;
  isRowSelected?: (row: Row<TData>) => boolean;
  columnAlignments?: Partial<Record<string, "left" | "center" | "right">>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page = 1,
  pageSize = 20,
  totalPages = 1,
  sorting = [],
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  emptyMessage = "Aucun résultat.",
  showPagination = true,
  ariaLabel,
  meta,
  getRowId,
  isRowSelected,
  columnAlignments = {},
}: DataTableProps<TData, TValue>) {
  "use no memo";

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize,
  };

  // TanStack Table intentionally exposes callbacks that React Compiler cannot memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    meta,
    getRowId,
    enableSortingRemoval: false,
    sortDescFirst: false,
    state: {
      sorting,
      pagination,
    },
    onSortingChange,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;

      if (next.pageSize !== pageSize) {
        onPageSizeChange?.(next.pageSize);
        return;
      }

      if (next.pageIndex !== page - 1) {
        onPageChange?.(next.pageIndex + 1);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="min-w-0 space-y-3">
      <Table aria-label={ariaLabel} className="min-w-180">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  aria-sort={
                    header.column.getIsSorted() === "asc"
                      ? "ascending"
                      : header.column.getIsSorted() === "desc"
                        ? "descending"
                        : header.column.getCanSort()
                          ? "none"
                          : undefined
                  }
                  className={cn(
                    header.id === "actions" &&
                      "sticky right-0 z-20 w-px border-l bg-muted text-right",
                    columnAlignments[header.id] === "right" && "text-right",
                    columnAlignments[header.id] === "center" && "text-center",
                  )}
                >
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        columnAlignments[header.id] === "right"
                          ? "h-8 w-full justify-end px-3 text-right"
                          : columnAlignments[header.id] === "center"
                            ? "h-8 w-full justify-center px-3 text-center"
                            : "-ml-3 h-8 px-3"
                      }
                      title={
                        header.column.getIsSorted() === "asc"
                          ? "Trier par ordre décroissant"
                          : "Trier par ordre croissant"
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {!header.column.getIsSorted() && (
                        <HugeiconsIcon
                          icon={Sorting05Icon}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="text-muted-foreground"
                        />
                      )}
                      {header.column.getIsSorted() === "asc" ? (
                        <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
                      ) : null}
                      {header.column.getIsSorted() === "desc" ? (
                        <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
                      ) : null}
                    </Button>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="group/row"
                data-state={
                  (isRowSelected?.(row) ?? row.getIsSelected())
                    ? "selected"
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      cell.column.id === "actions" &&
                        "sticky right-0 z-10 w-px border-l bg-card text-right group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
                      columnAlignments[cell.column.id] === "right" &&
                        "text-right",
                      columnAlignments[cell.column.id] === "center" &&
                        "text-center",
                    )}
                  >
                    {cell.column.id === "actions" ? (
                      <div className="ml-auto flex w-max min-w-max items-center justify-end gap-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <div className="flex items-center justify-end gap-4">
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-sm text-muted-foreground">
              Lignes par page
            </span>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} sur {Math.max(totalPages, 1)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
