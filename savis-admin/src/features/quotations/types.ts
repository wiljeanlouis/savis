import type {
  CreateOrderItemRequest,
  OrderAddress,
  OrderItem,
} from "@/features/orders/types";

export type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

export interface Quotation {
  id: string;
  quotationNumber: string;
  status: QuotationStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: OrderAddress | null;
  validUntil: string;
  note: string | null;
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  convertedOrderId: string | null;
  items: QuotationItem[];
}

export interface QuotationItem extends OrderItem {
  commercialType: "GOODS" | "SERVICE";
}

export interface SaveQuotationRequest {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: OrderAddress | null;
  validUntil: string;
  note: string | null;
  discountCents: number;
  deliveryFeeCents: number;
  items: CreateOrderItemRequest[];
}

export const quotationStatusLabels: Record<QuotationStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyée",
  ACCEPTED: "Acceptée",
  REJECTED: "Rejetée",
};

export const nextQuotationStatuses: Record<QuotationStatus, QuotationStatus[]> =
  {
    DRAFT: ["SENT"],
    SENT: ["ACCEPTED", "REJECTED"],
    ACCEPTED: [],
    REJECTED: [],
  };
