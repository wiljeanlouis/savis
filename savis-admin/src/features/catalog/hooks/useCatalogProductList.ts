import { useState } from "react";
import { useSearchParams } from "react-router";
import { filterCatalogProducts } from "../model/catalogProductList";
import type { CatalogProduct } from "../types";

export function useCatalogProductList(products: CatalogProduct[]) {
  const [params, setParams] = useSearchParams();
  const [mobileDetail, setMobileDetail] = useState(false);
  const filtered = filterCatalogProducts(products, params);
  const size = Number(params.get("size"));
  const pageSize = [10, 20, 30, 50].includes(size) ? size : 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requested = Number(params.get("page"));
  const selectedIndex = filtered.findIndex(
    (product) => product.id === params.get("selected"),
  );
  const page =
    selectedIndex >= 0
      ? Math.floor(selectedIndex / pageSize) + 1
      : Math.min(
          totalPages,
          Number.isSafeInteger(requested) && requested > 0 ? requested : 1,
        );
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected =
    items.find((product) => product.id === params.get("selected")) ?? items[0];
  const update = (key: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(key, value);
        next.set("page", "1");
        next.delete("selected");
        return next;
      },
      { replace: true },
    );
    setMobileDetail(false);
  };
  const resetFilters = () => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const key of [
          "search",
          "category",
          "publication",
          "availability",
          "sort",
          "page",
          "selected",
        ]) {
          next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
    setMobileDetail(false);
  };
  const select = (id: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("selected", id);
        return next;
      },
      { replace: true },
    );
    setMobileDetail(true);
  };
  const changePage = (nextPage: number) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("page", String(Math.max(1, Math.min(totalPages, nextPage))));
        next.delete("selected");
        return next;
      },
      { replace: true },
    );
    setMobileDetail(false);
  };
  return {
    params,
    update,
    resetFilters,
    select,
    items,
    selected,
    page,
    pageSize,
    totalPages,
    totalItems: filtered.length,
    changePage,
    mobileDetail,
    showList: () => setMobileDetail(false),
  };
}
