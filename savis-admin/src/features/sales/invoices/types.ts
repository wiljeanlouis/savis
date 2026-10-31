import type { OrderAddress, OrderItem } from "@/features/sales/orders/types";

export type InvoiceStatus = "DRAFT" | "ISSUED" | "CANCELLED";

export interface Invoice {
  id: string;
  invoiceNumber: string | null;
  sourceOrderId: string;
  sourceOrderNumber: string;
  status: InvoiceStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: OrderAddress | null;
  note: string | null;
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  gstCents: number;
  qstCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  issuedAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
}

export interface UpdateInvoiceRequest {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: OrderAddress | null;
  note: string | null;
  discountCents: number;
  deliveryFeeCents: number;
  gstCents: number;
  qstCents: number;
}

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Brouillon",
  ISSUED: "Émise",
  CANCELLED: "Annulée",
};

export const invoiceDisplayNumber = (invoice: Invoice) =>
  invoice.invoiceNumber ?? `Brouillon · ${invoice.sourceOrderNumber}`;
