import { useSearchParams } from "react-router";
import type { SortingState } from "@tanstack/react-table";

const pageSizes = [10, 20, 50];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr-CA");

function compareValues(
  left: string | number | null,
  right: string | number | null,
) {
  if (left === null || right === null) {
    return left === right ? 0 : left === null ? 1 : -1;
  }
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  return String(left).localeCompare(String(right), "fr-CA", {
    numeric: true,
    sensitivity: "base",
  });
}

export function useSalesList<T>(
  data: T[],
  {
    searchableText,
    sortValue,
    sortColumns,
    defaultSort,
    matchesFilters,
  }: {
    searchableText: (item: T) => string;
    sortValue: (item: T, column: string) => string | number | null;
    sortColumns: string[];
    defaultSort: string;
    matchesFilters?: (item: T, params: URLSearchParams) => boolean;
  },
) {
  const [params, setParams] = useSearchParams();
  const rawSort = params.get("sort") ?? defaultSort;
  const [rawSortColumn, rawSortDirection] = rawSort.split("-");
  const sort =
    sortColumns.includes(rawSortColumn) &&
    (rawSortDirection === "asc" || rawSortDirection === "desc")
      ? rawSort
      : defaultSort;
  const [sortColumn, sortDirection] = sort.split(/-(?=(?:asc|desc)$)/);
  const sorting: SortingState = [
    { id: sortColumn, desc: sortDirection === "desc" },
  ];

  const search = normalize(params.get("search") ?? "").trim();
  const filtered = data
    .filter(
      (item) =>
        (!search || normalize(searchableText(item)).includes(search)) &&
        (matchesFilters?.(item, params) ?? true),
    )
    .sort((left, right) => {
      const direction = sortDirection === "desc" ? -1 : 1;
      return (
        direction *
        compareValues(sortValue(left, sortColumn), sortValue(right, sortColumn))
      );
    });

  const rawSize = Number(params.get("size"));
  const pageSize = pageSizes.includes(rawSize) ? rawSize : 20;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const rawPage = Number(params.get("page"));
  const page =
    Number.isSafeInteger(rawPage) && rawPage > 0
      ? Math.min(rawPage, totalPages)
      : 1;
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  const update = (key: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.set("page", "1");
        return next;
      },
      { replace: true },
    );
  };

  const clearFilters = (keys: string[]) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        keys.forEach((key) => next.delete(key));
        next.set("page", "1");
        return next;
      },
      { replace: true },
    );
  };

  const changePage = (nextPage: number) =>
    update("page", String(Math.max(1, Math.min(totalPages, nextPage))));

  return {
    params,
    search: params.get("search") ?? "",
    items,
    totalItems,
    totalPages,
    page,
    pageSize,
    sorting,
    update,
    clearFilters,
    changePage,
    setSort: (value: string) => update("sort", value),
  };
}
