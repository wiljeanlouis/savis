import { api } from "@/shared/api";
import type {
  CreateOrderRequest,
  ImportOrdersResult,
  Order,
  OrderRequirementReport,
  OrderStatus,
  OrderSummary,
  UpdateOrderCustomerRequest,
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

export const createOrder = async (
  request: CreateOrderRequest,
): Promise<Order> => (await api.post<Order>("/orders", request)).data;

export const updateOrder = async ({
  orderId,
  request,
}: {
  orderId: string;
  request: CreateOrderRequest;
}): Promise<Order> =>
  (await api.put<Order>(`/orders/${orderId}`, request)).data;

export const updateOrderCustomer = async ({
  orderId,
  request,
}: {
  orderId: string;
  request: UpdateOrderCustomerRequest;
}): Promise<Order> =>
  (await api.patch<Order>(`/orders/${orderId}/customer`, request)).data;

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
