import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrder,
  getOrder,
  getOrderRequirementReport,
  getOrders,
  importOrders,
  updateOrder,
  updateOrderCustomer,
  updateOrderStatus,
} from "../api/orderApi";

export const ORDERS_QUERY_KEY = ["orders"];

export const useOrders = () =>
  useQuery({ queryKey: ORDERS_QUERY_KEY, queryFn: getOrders });

export const useOrder = (orderId: string | undefined) =>
  useQuery({
    queryKey: [...ORDERS_QUERY_KEY, orderId],
    queryFn: () => getOrder(orderId!),
    enabled: Boolean(orderId),
  });

export const useOrderRequirementReport = (orderId: string | undefined) =>
  useQuery({
    queryKey: [...ORDERS_QUERY_KEY, orderId, "requirements"],
    queryFn: () => getOrderRequirementReport(orderId!),
    enabled: Boolean(orderId),
  });

export const useCreateOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: async (order) => {
      client.setQueryData([...ORDERS_QUERY_KEY, order.id], order);
      await client.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
};

export const useUpdateOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateOrder,
    onSuccess: async (order) => {
      client.setQueryData([...ORDERS_QUERY_KEY, order.id], order);
      await client.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
};

export const useUpdateOrderCustomer = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateOrderCustomer,
    onSuccess: async (order) => {
      client.setQueryData([...ORDERS_QUERY_KEY, order.id], order);
      await client.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
};

export const useImportOrders = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: importOrders,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: async (order) => {
      client.setQueryData([...ORDERS_QUERY_KEY, order.id], order);
      await client.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
};
