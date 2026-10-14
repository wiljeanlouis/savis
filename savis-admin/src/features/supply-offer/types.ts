export type SupplyOfferStatus = "AVAILABLE" | "UNAVAILABLE";

export type SupplyOfferStatusFilter = SupplyOfferStatus | "ALL";

export type SupplyOfferSort =
  | "lastSeen,desc"
  | "lastSeen,asc"
  | "componentName,asc"
  | "componentName,desc"
  | "price,asc"
  | "price,desc";

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

export const supplyOfferSortLabels: Record<SupplyOfferSort, string> = {
  "lastSeen,desc": "Dernière observation : récent",
  "lastSeen,asc": "Dernière observation : ancien",
  "componentName,asc": "Composant : A-Z",
  "componentName,desc": "Composant : Z-A",
  "price,asc": "Prix du paquet : croissant",
  "price,desc": "Prix du paquet : décroissant",
};
