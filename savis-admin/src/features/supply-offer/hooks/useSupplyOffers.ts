import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { getSupplyOffers } from "../api/supplyOfferApi";
import type { SupplyOfferSort, SupplyOfferStatusFilter } from "../types";

export const SUPPLY_OFFERS_QUERY_KEY = ["supply-offers", "catalog"];

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/** Owns the read-only offer filters and their server-side paged query. */
export function useSupplyOffers() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SupplyOfferStatusFilter>("AVAILABLE");
  const [sort, setSort] = useState<SupplyOfferSort>("lastSeen,desc");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const changePage = useCallback((nextPage: number) => {
    setPage(Math.max(0, nextPage));
  }, []);

  const changeSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const changePageSize = useCallback((value: number) => {
    setPageSize(value);
    setPage(0);
  }, []);

  const changeStatus = useCallback((value: SupplyOfferStatusFilter) => {
    setStatus(value);
    setPage(0);
  }, []);

  const changeSort = useCallback((value: SupplyOfferSort) => {
    setSort(value);
    setPage(0);
  }, []);

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
