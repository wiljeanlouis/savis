import { api } from "@/shared/api";
import type { Invoice, InvoiceStatus, UpdateInvoiceRequest } from "../types";

export const getInvoices = async (status?: InvoiceStatus): Promise<Invoice[]> =>
  (
    await api.get<Invoice[]>("/invoices", {
      params: status ? { status } : undefined,
    })
  ).data;

export const getInvoice = async (invoiceId: string): Promise<Invoice> =>
  (await api.get<Invoice>(`/invoices/${invoiceId}`)).data;

export const createInvoiceFromOrder = async (
  orderId: string,
): Promise<Invoice> => (await api.post<Invoice>("/invoices", { orderId })).data;

export const updateInvoice = async ({
  invoiceId,
  request,
}: {
  invoiceId: string;
  request: UpdateInvoiceRequest;
}): Promise<Invoice> =>
  (await api.put<Invoice>(`/invoices/${invoiceId}`, request)).data;

export const issueInvoice = async (invoiceId: string): Promise<Invoice> =>
  (await api.post<Invoice>(`/invoices/${invoiceId}/issue`)).data;

export const cancelInvoice = async (invoiceId: string): Promise<Invoice> =>
  (await api.post<Invoice>(`/invoices/${invoiceId}/cancel`)).data;

export const getInvoiceDocument = async (
  invoiceId: string,
): Promise<{ content: Blob; fileName: string }> => {
  const response = await api.get<Blob>(`/invoices/${invoiceId}/pdf`, {
    responseType: "blob",
  });
  return {
    content: response.data,
    fileName:
      fileNameFromDisposition(response.headers["content-disposition"]) ??
      `facture-${invoiceId}.pdf`,
  };
};

function fileNameFromDisposition(value: string | undefined) {
  if (!value) return null;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(value)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return /filename="?([^";]+)"?/i.exec(value)?.[1] ?? null;
}
