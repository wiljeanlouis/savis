import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogProduct } from "@/features/catalog/types";
import {
  useCatalogProductSearch,
  useCatalogProductsByIds,
} from "@/features/catalog/hooks/useCatalogApi";
import type { CreateOrderRequest, Order } from "../types";
import {
  activeModes,
  adminOrderDraftFromOrder,
  buildCreateOrderRequest,
  createAdminOrderItem,
  emptyAdminOrderDraft,
  type AdminOrderDraft,
  type AdminOrderItemDraft,
} from "../model/adminOrderDraft";

const NEW_ORDER_DRAFT_KEY = "savis:orders:new-draft";

export function useOrderEditor({
  order,
  editable,
  persistNewDraft = false,
}: {
  order?: Order;
  editable: boolean;
  persistNewDraft?: boolean;
}) {
  const emptyDraft = useMemo(() => emptyAdminOrderDraft(), []);
  const [draft, setDraft] = useState<AdminOrderDraft>(() =>
    persistNewDraft ? loadDraft() : emptyDraft,
  );
  const [baseline, setBaseline] = useState<AdminOrderDraft>(emptyDraft);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<CatalogProduct[]>(
    [],
  );
  const initializedOrderId = useRef<string | null>(null);

  useEffect(() => {
    if (order && initializedOrderId.current !== order.id) {
      const next = adminOrderDraftFromOrder(order);
      initializedOrderId.current = order.id;
      setDraft(next);
      setBaseline(next);
      setSelectedProducts([]);
    }
  }, [order]);

  useEffect(() => {
    if (!persistNewDraft) return;
    window.sessionStorage.setItem(NEW_ORDER_DRAFT_KEY, JSON.stringify(draft));
  }, [draft, persistNewDraft]);

  const productIds = draft.items.map((item) => item.productId);
  const existingProducts = useCatalogProductsByIds(productIds, editable);
  const productsQuery = useCatalogProductSearch(productSearch, editable);
  const searchResults = (productsQuery.data ?? []).filter(
    (product) =>
      product.available &&
      product.id &&
      activeModes(product).length > 0 &&
      matchesProductSearch(product, productSearch),
  );
  const products = mergeProducts(
    selectedProducts,
    existingProducts.data,
    searchResults,
  );

  function addProduct(product: CatalogProduct) {
    setDraft((current) => ({
      ...current,
      items: [...current.items, createAdminOrderItem(product)],
    }));
    setSelectedProducts((current) => mergeProducts(current, [product]));
  }

  function patchItem(key: string, patch: Partial<AdminOrderItemDraft>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.key === key ? { ...item, ...patch } : item,
      ),
    }));
  }

  function removeItem(key: string) {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((item) => item.key !== key),
    }));
  }

  function buildRequest(): CreateOrderRequest {
    return buildCreateOrderRequest(draft, products);
  }

  function resetFromOrder(value: Order) {
    const next = adminOrderDraftFromOrder(value);
    initializedOrderId.current = value.id;
    setDraft(next);
    setBaseline(next);
    setProductSearch("");
    setSelectedProducts([]);
  }

  function resetNewDraft() {
    const next = emptyAdminOrderDraft();
    setDraft(next);
    setBaseline(next);
    setProductSearch("");
    setSelectedProducts([]);
    window.sessionStorage.removeItem(NEW_ORDER_DRAFT_KEY);
  }

  return {
    draft,
    setDraft,
    products,
    searchResults,
    productSearch,
    setProductSearch,
    isSearchingProducts: productsQuery.isPending || productsQuery.isFetching,
    isProductSearchError: productsQuery.isError,
    isLoadingSelectedProducts: existingProducts.isPending,
    selectedProductsError: existingProducts.isError,
    isDirty: JSON.stringify(draft) !== JSON.stringify(baseline),
    addProduct,
    patchItem,
    removeItem,
    buildRequest,
    resetFromOrder,
    resetNewDraft,
  };
}

function loadDraft(): AdminOrderDraft {
  try {
    const stored = window.sessionStorage.getItem(NEW_ORDER_DRAFT_KEY);
    return stored
      ? (JSON.parse(stored) as AdminOrderDraft)
      : emptyAdminOrderDraft();
  } catch {
    return emptyAdminOrderDraft();
  }
}

function mergeProducts(...groups: CatalogProduct[][]) {
  return Array.from(
    new Map(
      groups
        .flat()
        .filter((product) => product.id)
        .map((product) => [product.id!, product]),
    ).values(),
  );
}

function matchesProductSearch(product: CatalogProduct, search: string) {
  const normalizedSearch = normalize(search);
  return (
    !normalizedSearch ||
    normalize(
      [product.name, product.code, product.description].join(" "),
    ).includes(normalizedSearch)
  );
}

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
