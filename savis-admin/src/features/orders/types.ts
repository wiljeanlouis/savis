export type OrderStatus =
  | "NEW"
  | "ACCEPTED"
  | "IN_PREPARATION"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type OrderSource = "SAVOURETPLUS_WEB" | "ADMIN";

interface OrderBase {
  id: string;
  orderNumber: string;
  source: OrderSource;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  totalCents: number;
  placedAt: string;
  importedAt: string;
}

export interface OrderSummary extends OrderBase {
  itemCount: number;
  itemPreviews: OrderItemPreview[];
}

export interface OrderItemPreview {
  id: string;
  productName: string;
  imageUrl: string | null;
}

export interface Order extends OrderBase {
  customerAddress: OrderAddress | null;
  note: string | null;
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  externalOrderId: string | null;
  acceptedAt: string | null;
  inPreparationAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  productType:
    | "STANDARD"
    | "SINGLE_CHOICE"
    | "SINGLE_CHOICE_BUNDLE"
    | "INGREDIENT_CUSTOMIZATION";
  imageUrl: string | null;
  quantity: number;
  basePriceCents: number;
  unitPriceCents: number;
  lineTotalCents: number;
  purchaseModeId: string | null;
  purchaseModeLabel: string | null;
  purchaseModeQuantity: number | null;
  allocationType: "NONE" | "SINGLE_CHOICE" | "CHOICE_ALLOCATION";
  rawKey: string | null;
  choiceSelections: OrderChoiceSelection[];
  choiceAllocations: OrderChoiceAllocation[];
  ingredientSelections: OrderIngredientSelection[];
}

export interface OrderChoiceSelection {
  choiceId: string;
  choiceName: string;
  groupLabel: string;
}

export interface OrderChoiceAllocation {
  choiceId: string;
  choiceName: string;
  quantity: number;
}

export interface OrderIngredientSelection {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  defaultQuantity: number;
  extraPriceCents: number;
}

export interface ImportOrdersResult {
  fetchedCount: number;
  importedCount: number;
  alreadyImportedCount: number;
  failedCount: number;
  acknowledgmentFailedCount: number;
  failures: {
    externalOrderId: string;
    message: string;
    localOrderPersisted: boolean;
  }[];
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: OrderAddress | null;
  note: string | null;
  discountCents: number;
  deliveryFeeCents: number;
  items: CreateOrderItemRequest[];
}

export interface OrderAddress {
  line1: string | null;
  line2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
}

export type OrderDocumentType = "quote" | "invoice";

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  purchaseModeCode: string;
  choiceCode: string | null;
  allocations: { choiceCode: string; quantity: number }[];
  ingredients: { ingredientCode: string; quantity: number }[];
}

export interface OrderRequirementReport {
  orderId: string;
  orderNumber: string;
  generatedAt: string;
  requirements: OrderRequirement[];
  complete: boolean;
  warnings: string[];
}

export interface OrderRequirement {
  componentKey: string;
  componentName: string;
  requiredQuantity: number;
  unit: string;
  sourcingInformation: SourcingInformation | null;
  sources: OrderRequirementSource[];
  onHandQuantity: number | null;
  missingQuantity: number | null;
  purchaseQuantity: number | null;
  estimatedPurchaseCost: MoneyValue | null;
}

export interface OrderRequirementSource {
  bomId: string;
  bomName: string;
  orderItemId: string;
  productName: string;
  configurationSource: string;
  quantityContribution: number;
  unit: string;
}

export interface SourcingInformation {
  supplierProductId: string;
  productName: string | null;
  imageUrl: string | null;
  brandOrLabel: string | null;
  supplierName: string | null;
  packageSize: number | null;
  packageUnit: string | null;
  currentPrice: MoneyValue | null;
  observedAt: string | null;
}

export interface MoneyValue {
  amount: number;
  currency: string;
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  NEW: "Nouvelle",
  ACCEPTED: "Acceptée",
  IN_PREPARATION: "En préparation",
  READY: "Prête",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  REJECTED: "Rejetée",
};

export const orderSourceLabels: Record<OrderSource, string> = {
  SAVOURETPLUS_WEB: "SavouretPlus Web",
  ADMIN: "Administration",
};

export const nextOrderStatuses: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["IN_PREPARATION", "CANCELLED"],
  IN_PREPARATION: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

export const formatOrderCurrency = (cents: number) =>
  new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);

export const formatOrderDate = (value: string) =>
  new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
