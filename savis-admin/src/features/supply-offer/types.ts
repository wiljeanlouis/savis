export type SupplyOfferStatus = "AVAILABLE" | "UNAVAILABLE";

export type SupplyOfferStatusFilter = SupplyOfferStatus | "ALL";

export type SupplyOfferSortField = "lastSeen" | "componentName" | "price";

export type SupplyOfferSortDirection = "asc" | "desc";

export type SupplyOfferSort =
  `${SupplyOfferSortField},${SupplyOfferSortDirection}`;

export interface SupplyOfferProvider {
  name: string | null;
  identifier: string | null;
  site: string | null;
}

export interface SupplyOfferPrice {
  amount: number;
  currency: string;
}

export interface SupplyOfferPackageSize {
  value: number;
  unit: string;
}

export interface SupplyOffer {
  id: string;
  componentName: string;
  label: string | null;
  brand: string | null;
  imageUrl: string | null;
  url: string | null;
  provider: SupplyOfferProvider | null;
  price: SupplyOfferPrice | null;
  packageSize: SupplyOfferPackageSize | null;
  status: SupplyOfferStatus;
  lastSeen: string | null;
}

export interface SupplyOfferCatalogPage {
  content: SupplyOffer[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface SupplyOfferCatalogParams {
  page: number;
  size: number;
  search?: string;
  status: SupplyOfferStatusFilter;
  sort: SupplyOfferSort;
}

export const supplyOfferStatusLabels: Record<SupplyOfferStatus, string> = {
  AVAILABLE: "Disponible",
  UNAVAILABLE: "Indisponible",
};

export const supplyOfferSortFieldLabels: Record<SupplyOfferSortField, string> =
  {
    lastSeen: "Dernière observation",
    componentName: "Composant",
    price: "Prix du paquet",
  };
