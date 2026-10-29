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

export interface BomCostDiagnostic {
  code: string;
  source: string;
  message: string;
  blocking: boolean;
}

export interface BomCostLine {
  label: string;
  status: "KNOWN" | "MISSING" | "NOT_APPLICABLE";
  amount: BomPrice | null;
  quantity: number;
  unit: string;
  hourlyRate: BomPrice | null;
  source: {
    selectedOfferId: string | null;
    usedOfferId: string | null;
    observedAt: string | null;
    packagePrice: BomPrice | null;
    packageQuantity: number | null;
    packageUnit: string | null;
  } | null;
  diagnostics: BomCostDiagnostic[];
}

export interface BomCosting {
  totalCost: BomPrice | null;
  yieldQuantity: number;
  knownSubtotal: BomPrice;
  componentSubtotal: BomPrice;
  activitySubtotal: BomPrice;
  complete: boolean;
  components: BomCostLine[];
  activities: BomCostLine[];
  diagnostics: BomCostDiagnostic[];
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
  costing?: BomCosting | null;
}
