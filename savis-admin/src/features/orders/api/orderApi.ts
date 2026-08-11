import { api } from "@/shared/api";
import type {
  CreateOrderRequest,
  ImportOrdersResult,
  Order,
  OrderStatus,
  OrderSummary,
} from "../types";

export const getOrders = async (): Promise<OrderSummary[]> =>
  (await api.get<OrderSummary[]>("/orders")).data;

export const getOrder = async (orderId: string): Promise<Order> =>
  (await api.get<Order>(`/orders/${orderId}`)).data;

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
