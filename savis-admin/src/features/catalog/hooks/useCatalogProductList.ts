import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { filterCatalogProducts } from "../model/catalogProductList";
import type { CatalogProduct } from "../types";

export function useCatalogProductList(
  products: CatalogProduct[],
  loaded = true,
) {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (!params.has("availability")) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("availability");
        return next;
      },
      { replace: true },
    );
  }, [params, setParams]);
  const filtered = filterCatalogProducts(products, params);
  useEffect(() => {
    const id = params.get("selected");
    if (!loaded || !id || filtered.some((product) => product.id === id)) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (next.get("selected") === id) next.delete("selected");
        return next;
      },
      { replace: true },
    );
  }, [loaded, filtered, params, setParams]);
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
  const selected = items.find(
    (product) => product.id === params.get("selected"),
  );
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
  };
  const resetFilters = () => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const key of [
          "category",
          "publication",
          "availability",
          "page",
          "selected",
        ]) {
          next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  };
  const select = (id: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("selected", id);
      return next;
    });
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
    showList: () =>
      setParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("selected");
        return next;
      }),
  };
}
