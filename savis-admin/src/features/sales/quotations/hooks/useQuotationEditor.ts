import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogProduct } from "@/features/catalog/types";
import {
  useCatalogProductSearch,
  useCatalogProductsByIds,
} from "@/features/catalog/hooks/useCatalogApi";
import {
  activeModes,
  createAdminOrderItem,
  type AdminOrderItemDraft,
} from "@/features/sales/orders/model/adminOrderDraft";
import type { Quotation, SaveQuotationRequest } from "../types";
import {
  buildSaveQuotationRequest,
  emptyQuotationDraft,
  quotationDraftFromQuotation,
  type QuotationDraft,
} from "../model/quotationDraft";

import { quotationDraftForStorage } from "../model/quotationDraftStorage";

const NEW_QUOTATION_DRAFT_KEY = "savis:quotations:new-draft";

export function useQuotationEditor({
  quotation,
  editable,
  persistNewDraft = false,
}: {
  quotation?: Quotation;
  editable: boolean;
  persistNewDraft?: boolean;
}) {
  const emptyDraft = useMemo(() => emptyQuotationDraft(), []);
  const [draft, setDraft] = useState<QuotationDraft>(() =>
    persistNewDraft ? loadDraft() : emptyDraft,
  );
  const [baseline, setBaseline] = useState(emptyDraft);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<CatalogProduct[]>(
    [],
  );
  const initializedId = useRef<string | null>(null);

  useEffect(() => {
    if (quotation && initializedId.current !== quotation.id) {
      const next = quotationDraftFromQuotation(quotation);
      initializedId.current = quotation.id;
      setDraft(next);
      setBaseline(next);
      setSelectedProducts([]);
    }
  }, [quotation]);

  useEffect(() => {
    if (persistNewDraft) {
      window.sessionStorage.setItem(
        NEW_QUOTATION_DRAFT_KEY,
        JSON.stringify(quotationDraftForStorage(draft)),
      );
    }
  }, [draft, persistNewDraft]);

  const productIds = draft.commercial.items.map((item) => item.productId);
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

  function setCommercial(commercial: QuotationDraft["commercial"]) {
    setDraft((current) => ({ ...current, commercial }));
  }

  function addProduct(product: CatalogProduct) {
    setDraft((current) => ({
      ...current,
      commercial: {
        ...current.commercial,
        items: [...current.commercial.items, createAdminOrderItem(product)],
      },
    }));
    setSelectedProducts((current) => mergeProducts(current, [product]));
  }

  function patchItem(key: string, patch: Partial<AdminOrderItemDraft>) {
    setDraft((current) => ({
      ...current,
      commercial: {
        ...current.commercial,
        items: current.commercial.items.map((item) =>
          item.key === key ? { ...item, ...patch } : item,
        ),
      },
    }));
  }

  function removeItem(key: string) {
    setDraft((current) => ({
      ...current,
      commercial: {
        ...current.commercial,
        items: current.commercial.items.filter((item) => item.key !== key),
      },
    }));
  }

  function buildRequest(): SaveQuotationRequest {
    return buildSaveQuotationRequest(draft, products);
  }

  function resetFromQuotation(value: Quotation) {
    const next = quotationDraftFromQuotation(value);
    initializedId.current = value.id;
    setDraft(next);
    setBaseline(next);
    setProductSearch("");
    setSelectedProducts([]);
  }

  function resetNewDraft() {
    const next = emptyQuotationDraft();
    setDraft(next);
    setBaseline(next);
    setProductSearch("");
    setSelectedProducts([]);
    window.sessionStorage.removeItem(NEW_QUOTATION_DRAFT_KEY);
  }

  return {
    draft,
    setDraft,
    setCommercial,
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
    resetFromQuotation,
    resetNewDraft,
  };
}

function loadDraft(): QuotationDraft {
  try {
    const stored = window.sessionStorage.getItem(NEW_QUOTATION_DRAFT_KEY);
    return stored
      ? (JSON.parse(stored) as QuotationDraft)
      : emptyQuotationDraft();
  } catch {
    return emptyQuotationDraft();
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
