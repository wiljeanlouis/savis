export type OfferStatus = "NEW" | "VALID" | "REJECTED";

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

export interface Offer {
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
  status: OfferStatus;
  last_retrieved_at: string;
  next_refresh_at: string;
  refresh_frequency_hours: number;
  last_seen_task_id: string;
}

export interface OffersPage {
  items: Offer[];
  page: number;
  size: number;
  total_items: number;
  total_pages: number;
}
