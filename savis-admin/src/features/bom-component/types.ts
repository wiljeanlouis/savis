export type BomComponentStatus = "NEW" | "VALID" | "REJECTED";
export type BomComponentType = "FOOD" | "DECORATION";

export interface BomComponentEditValues {
  status: BomComponentStatus;
  refreshFrequencyHours: number;
  refreshNow: boolean;
}

export interface Price {
  amount: string;
  currency: string;
}

export interface PackageSize {
  value: number;
  unit: string;
}

export interface Provider {
  name: string;
  identifier: string;
  site: string;
  address: string;
}

export interface BomComponent {
  id: string;
  external_id: string;
  url: string;
  brand: string;
  label: string;
  price: Price | null;
  package_size: PackageSize | null;
  image_url: string;
  provider: Provider;
  search_term: string;
  status: BomComponentStatus;
  type: BomComponentType;
  last_retrieved_at: string;
  next_refresh_at: string;
  refresh_frequency_hours: number;
  last_seen_task_id: string;
}

export interface BomComponentsPage {
  items: BomComponent[];
  page: number;
  size: number;
  total_items: number;
  total_pages: number;
}

export interface SearchTermFacet {
  search_term: string;
  count: number;
}
