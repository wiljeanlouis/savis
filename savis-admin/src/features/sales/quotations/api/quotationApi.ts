import { api } from "@/shared/api";
import type {
  Quotation,
  QuotationStatus,
  SaveQuotationRequest,
} from "../types";

export const getQuotations = async (): Promise<Quotation[]> =>
  (await api.get<Quotation[]>("/quotations")).data;

export const getQuotation = async (quotationId: string): Promise<Quotation> =>
  (await api.get<Quotation>(`/quotations/${quotationId}`)).data;

export const createQuotation = async (
  request: SaveQuotationRequest,
): Promise<Quotation> =>
  (await api.post<Quotation>("/quotations", request)).data;

export const updateQuotation = async ({
  quotationId,
  request,
}: {
  quotationId: string;
  request: SaveQuotationRequest;
}): Promise<Quotation> =>
  (await api.put<Quotation>(`/quotations/${quotationId}`, request)).data;

export const updateQuotationStatus = async ({
  quotationId,
  status,
}: {
  quotationId: string;
  status: QuotationStatus;
}): Promise<Quotation> =>
  (await api.put<Quotation>(`/quotations/${quotationId}/status`, { status }))
    .data;

export const convertQuotation = async (
  quotationId: string,
): Promise<{ orderId: string }> =>
  (await api.post<{ orderId: string }>(`/quotations/${quotationId}/convert`))
    .data;

export const getQuotationDocument = async (
  quotationId: string,
): Promise<{ content: Blob; fileName: string }> => {
  const response = await api.get<Blob>(`/quotations/${quotationId}/pdf`, {
    responseType: "blob",
  });
  return {
    content: response.data,
    fileName:
      fileNameFromDisposition(response.headers["content-disposition"]) ??
      `soumission-${quotationId}.pdf`,
  };
};

function fileNameFromDisposition(value: string | undefined) {
  if (!value) return null;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(value)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return /filename="?([^";]+)"?/i.exec(value)?.[1] ?? null;
}
