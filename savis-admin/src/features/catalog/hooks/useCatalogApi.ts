import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  analyzeProductPricing,
  analyzeWorstCasePricing,
  deleteCatalogProduct,
  getCatalogProducts,
  publishCatalog,
  publishProduct,
  saveCatalogProduct,
  searchCatalogProducts,
  unpublishProduct,
} from "../api/catalogApi";

const PRODUCTS = ["catalog-products"];

export const useCatalogProducts = () =>
  useQuery({ queryKey: PRODUCTS, queryFn: getCatalogProducts });

export const useCatalogProductSearch = (search: string, enabled = true) => {
  const debouncedSearch = useDebouncedValue(search, 300);
  return useQuery({
    queryKey: [...PRODUCTS, "search", debouncedSearch],
    queryFn: () => searchCatalogProducts(debouncedSearch),
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useSaveCatalogProduct = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveCatalogProduct,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: PRODUCTS });
    },
  });
};

export const useDeleteCatalogProduct = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteCatalogProduct,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: PRODUCTS });
    },
  });
};

export const usePublishCatalog = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: publishCatalog,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: PRODUCTS });
    },
  });
};

export const usePublishProduct = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: publishProduct,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: PRODUCTS });
    },
  });
};

export const useUnpublishProduct = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: unpublishProduct,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: PRODUCTS });
    },
  });
};

export const useAnalyzeProductPricing = () =>
  useMutation({ mutationFn: analyzeProductPricing });
export const useAnalyzeWorstCasePricing = () =>
  useMutation({ mutationFn: analyzeWorstCasePricing });

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debounced;
}
