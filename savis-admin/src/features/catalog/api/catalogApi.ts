import { api } from "@/shared/api";
import type {
  CatalogProduct,
  ProductCategory,
  ProductConfiguration,
  ProductPricingAnalysis,
} from "../types";

export const getCatalogProducts = async (): Promise<CatalogProduct[]> =>
  (await api.get<CatalogProduct[]>("/catalog/products")).data;

export const saveCatalogProduct = async (
  product: CatalogProduct,
): Promise<string | CatalogProduct> => {
  if (product.id) {
    return (
      await api.put<CatalogProduct>(`/catalog/products/${product.id}`, product)
    ).data;
  }
  return (await api.post<string>("/catalog/products", product)).data;
};

export const deleteCatalogProduct = (productId: string) =>
  api.delete(`/catalog/products/${productId}`);

export const getProductCategories = async (): Promise<ProductCategory[]> =>
  (await api.get<ProductCategory[]>("/catalog/categories")).data;

export const saveProductCategory = async (
  category: ProductCategory,
): Promise<string> => {
  const path = category.id
    ? `/catalog/categories/${category.id}`
    : "/catalog/categories";
  const method = category.id ? api.put : api.post;
  return (await method<string>(path, category)).data;
};

export const analyzeProductPricing = async ({
  productId,
  configuration,
}: {
  productId: string;
  configuration: ProductConfiguration;
}): Promise<ProductPricingAnalysis> =>
  (
    await api.post<ProductPricingAnalysis>(
      `/catalog/products/${productId}/pricing-analysis`,
      configuration,
    )
  ).data;

export const analyzeWorstCasePricing = async ({
  productId,
  purchaseModeCode,
}: {
  productId: string;
  purchaseModeCode: string;
}): Promise<ProductPricingAnalysis> =>
  (
    await api.get<ProductPricingAnalysis>(
      `/catalog/products/${productId}/worst-case-pricing`,
      { params: { purchaseModeCode } },
    )
  ).data;

export interface CatalogPublicationResult {
  publishedProductCount: number;
}

export const publishCatalog = async (): Promise<CatalogPublicationResult> =>
  (await api.post<CatalogPublicationResult>("/catalog/products/publish")).data;

export const publishProduct = (productId: string) =>
  api.post(`/catalog/products/${productId}/publish`);

export const unpublishProduct = (productId: string) =>
  api.post(`/catalog/products/${productId}/unpublish`);
