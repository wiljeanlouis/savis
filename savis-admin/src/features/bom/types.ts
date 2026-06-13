export interface BomComponent {
  componentName: string;
  quantity: number;
  unit: string;
  selectedOfferId?: string | null;
}

export interface BomOffer {
  id: string;
  url: string | null;
  componentName: string;
  brand: string | null;
  label: string | null;
  imageUrl: string | null;
  price: {
    amount: number;
    currency: string;
  } | null;
  packageSize: {
    value: number;
    unit: string;
  } | null;
  provider: {
    name: string;
    identifier: string;
    site: string | null;
  } | null;
}

export type ActivityType =
  | "PREP"
  | "COOK"
  | "ASSEMBLY"
  | "PACKAGING"
  | "INSTALLATION"
  | "DELIVERY"
  | "CLEANUP"
  | "CUSTOM";

export interface BomActivity {
  id?: number | null;
  type: ActivityType;
  minutes: number;
  sequence: number;
}

export interface BomYield {
  quantity: number;
  unit: string;
}

export type BomType = "FOOD" | "MATERIAL";

export interface BomPrice {
  amount: number;
  currency: string;
}

export interface Bom {
  id: string | null;
  name: string;
  type: BomType;
  description: string;
  imageUrl: string;
  instructions: string;
  components: BomComponent[];
  activities: BomActivity[];
  yield: BomYield;
  price?: BomPrice | null;
}
