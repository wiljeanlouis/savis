import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Button } from "@/shared/ui/button";
import { CatalogProductImage } from "./CatalogProductImage";
import type { CatalogProduct } from "../types";
import { productCategories } from "../types";
import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  startingPrice,
  productMoney,
  compositionCount,
} from "../model/catalogProductList";
type DetailsMeta = {
  selectedId?: string | null;
  onSelect: (id: string) => void;
};
const columns: ColumnDef<CatalogProduct>[] = [
  {
    id: "name",
    accessorFn: (row) => row.name,
    header: "Produit",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <>
          <div className="flex items-center gap-3">
            <CatalogProductImage
              src={product.imageUrl}
              name={product.name}
              className="size-10"
            />
            <span className="max-w-72 whitespace-normal font-medium">
              {product.name}
            </span>
          </div>
        </>
      );
    },
  },
  {
    id: "category",
    accessorFn: (row) => row.category,
    header: "Catégorie",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <>
          {productCategories.find((c) => c.value === product.category)?.label}
        </>
      );
    },
  },
  {
    id: "price",
    accessorFn: (row) => startingPrice(row)?.amount,
    header: "Prix à partir de",
    cell: ({ row }) => {
      const product = row.original;
      return <>{productMoney(startingPrice(product))}</>;
    },
  },
  {
    id: "publication",
    accessorFn: (row) => row.published,
    header: "Publication",
    cell: ({ row }) => {
      const product = row.original;
      return <>{product.published ? "Publié" : "Brouillon"}</>;
    },
  },
  {
    id: "modes",
    accessorFn: (row) => row.purchaseModes.length,
    header: "Modes de vente",
    cell: ({ row }) => {
      const product = row.original;
      return <>{product.purchaseModes.length}</>;
    },
  },
  {
    id: "compositions",
    accessorFn: (row) => compositionCount(row),
    header: "Compositions",
    cell: ({ row }) => {
      const product = row.original;
      return <>{compositionCount(product)}</>;
    },
  },
  {
    id: "actions",
    enableSorting: false,
    header: "Actions",
    cell: ({ row, table }) => {
      const product = row.original;
      const { selectedId, onSelect } = table.options.meta as DetailsMeta;
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            aria-label={`Détails de ${product.name}`}
            data-selected={product.id === selectedId}
            onClick={() => product.id && onSelect(product.id)}
          >
            <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
            Détails
          </Button>
        </>
      );
    },
  },
];
export function CatalogProductDataTable({
  products,
  selectedId,
  onSelect,
  params,
  onSort,
}: {
  products: CatalogProduct[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  params: URLSearchParams;
  onSort: (value: string) => void;
}) {
  const sortValue = params.get("sort") ?? "name-asc";
  const sorting: SortingState = [
    {
      id: sortValue.replace(/-(asc|desc)$/, ""),
      desc: sortValue.endsWith("-desc"),
    },
  ];
  return (
    <DataTable
      columns={columns}
      data={products}
      ariaLabel="Liste des produits"
      showPagination={false}
      sorting={sorting}
      columnAlignments={{
        price: "right",
        modes: "right",
        compositions: "right",
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
