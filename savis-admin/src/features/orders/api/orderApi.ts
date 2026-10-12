import { api } from "@/shared/api";
import type {
  CreateOrderRequest,
  ImportOrdersResult,
  Order,
  OrderRequirementReport,
  OrderDocumentType,
  OrderStatus,
  OrderSummary,
} from "../types";

export const getOrders = async (): Promise<OrderSummary[]> =>
  (await api.get<OrderSummary[]>("/orders")).data;

export const getOrder = async (orderId: string): Promise<Order> =>
  (await api.get<Order>(`/orders/${orderId}`)).data;

export const getOrderRequirementReport = async (
  orderId: string,
): Promise<OrderRequirementReport> =>
  (await api.get<OrderRequirementReport>(`/orders/${orderId}/requirements`))
    .data;

export const getOrderDocument = async (
  orderId: string,
  documentType: OrderDocumentType,
): Promise<{ content: Blob; fileName: string }> => {
  const response = await api.get<Blob>(
    `/orders/${orderId}/documents/${documentType}`,
    { responseType: "blob" },
  );
  return {
    content: response.data,
    fileName:
      fileNameFromDisposition(response.headers["content-disposition"]) ??
      `${documentType}-${orderId}.pdf`,
  };
};

export const createOrder = async (
  request: CreateOrderRequest,
): Promise<Order> => (await api.post<Order>("/orders", request)).data;

export const importOrders = async (): Promise<ImportOrdersResult> =>
  (await api.post<ImportOrdersResult>("/orders/import")).data;

export const updateOrderStatus = async ({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}): Promise<Order> =>
  (await api.put<Order>(`/orders/${orderId}/status`, { status })).data;

function fileNameFromDisposition(value: string | undefined) {
  if (!value) return null;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(value)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return /filename="?([^";]+)"?/i.exec(value)?.[1] ?? null;
}
