import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createOrder,
  getOrder,
  getOrderRequirementReport,
  getOrderDocument,
  getOrders,
  importOrders,
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

export const useOrderDocument = () =>
  useMutation({
    mutationFn: ({
      orderId,
      documentType,
    }: {
      orderId: string;
      documentType: import("../types").OrderDocumentType;
    }) => getOrderDocument(orderId, documentType),
  });

export const useOrderDocumentDownload = () => {
  const mutation = useOrderDocument();

  const download = async (
    orderId: string,
    documentType: import("../types").OrderDocumentType,
  ) => {
    try {
      const document = await mutation.mutateAsync({ orderId, documentType });
      const url = URL.createObjectURL(document.content);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.fileName;
      link.style.display = "none";
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      toast.error("Impossible de générer le document PDF.");
    }
  };

  return {
    download,
    isPending: mutation.isPending,
    pendingOrderId: mutation.variables?.orderId,
  };
};

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
