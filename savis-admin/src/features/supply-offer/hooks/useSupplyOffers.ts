import { useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getSupplyOffers } from "../api/supplyOfferApi";
import type { SupplyOfferSort, SupplyOfferStatusFilter } from "../types";

export const SUPPLY_OFFERS_QUERY_KEY = ["supply-offers", "catalog"];

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/** Owns the read-only offer filters and their server-side paged query. */
export function useSupplyOffers() {
  const [params, setParams] = useSearchParams();
  const integer = (key: string, fallback: number, minimum: number) => {
    const value = Number(params.get(key) ?? fallback);
    return Number.isInteger(value) && value >= minimum ? value : fallback;
  };
  const page = integer("page", 0, 0);
  const pageSize = Math.min(100, integer("size", DEFAULT_PAGE_SIZE, 1));
  const search = params.get("search") ?? "";
  const rawStatus = params.get("status");
  const status: SupplyOfferStatusFilter =
    rawStatus === "UNAVAILABLE" || rawStatus === "ALL"
      ? rawStatus
      : "AVAILABLE";
  const rawSort = params.get("sort") ?? "";
  const sort: SupplyOfferSort =
    /^(lastSeen|componentName|price),(asc|desc)$/.test(rawSort)
      ? (rawSort as SupplyOfferSort)
      : "lastSeen,desc";
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const update = (values: Record<string, string>) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(values).forEach(([key, value]) => next.set(key, value));
      return next;
    });
  const changePage = (value: number) =>
    update({ page: String(Math.max(0, value)) });
  const changeSearch = (value: string) => update({ search: value, page: "0" });
  const changePageSize = (value: number) =>
    update({ size: String(value), page: "0" });
  const changeStatus = (value: SupplyOfferStatusFilter) =>
    update({ status: value, page: "0" });
  const changeSort = (value: SupplyOfferSort) =>
    update({ sort: value, page: "0" });

  const query = useQuery({
    queryKey: [
      ...SUPPLY_OFFERS_QUERY_KEY,
      {
        page,
        size: pageSize,
        search: debouncedSearch.trim(),
        status,
        sort,
      },
    ],
    queryFn: () =>
      getSupplyOffers({
        page,
        size: pageSize,
        search: debouncedSearch,
        status,
        sort,
      }),
    placeholderData: keepPreviousData,
  });

  return {
    query,
    page,
    pageSize,
    search,
    status,
    sort,
    setPage: changePage,
    setPageSize: changePageSize,
    setSearch: changeSearch,
    setStatus: changeStatus,
    setSort: changeSort,
  };
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debounced;
}
