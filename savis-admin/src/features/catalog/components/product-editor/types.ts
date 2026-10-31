import type { CatalogProduct } from "../../types";

export type UpdateCatalogProduct = <K extends keyof CatalogProduct>(
  key: K,
  value: CatalogProduct[K],
) => void;
