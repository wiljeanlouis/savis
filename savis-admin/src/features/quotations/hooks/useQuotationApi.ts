import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  convertQuotation,
  createQuotation,
  getQuotation,
  getQuotationDocument,
  getQuotations,
  updateQuotation,
  updateQuotationStatus,
} from "../api/quotationApi";

export const QUOTATIONS_QUERY_KEY = ["quotations"];

export const useQuotations = () =>
  useQuery({ queryKey: QUOTATIONS_QUERY_KEY, queryFn: getQuotations });

export const useQuotation = (quotationId: string | undefined) =>
  useQuery({
    queryKey: [...QUOTATIONS_QUERY_KEY, quotationId],
    queryFn: () => getQuotation(quotationId!),
    enabled: Boolean(quotationId),
  });

function useMutationWithCache<TVariables>(
  mutationFn: (variables: TVariables) => Promise<import("../types").Quotation>,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (quotation) => {
      client.setQueryData([...QUOTATIONS_QUERY_KEY, quotation.id], quotation);
      await client.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
    },
  });
}

export const useCreateQuotation = () => useMutationWithCache(createQuotation);
export const useUpdateQuotation = () => useMutationWithCache(updateQuotation);
export const useUpdateQuotationStatus = () =>
  useMutationWithCache(updateQuotationStatus);

export const useConvertQuotation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: convertQuotation,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY }),
        client.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
  });
};

export const useQuotationDocumentDownload = () => {
  const mutation = useMutation({ mutationFn: getQuotationDocument });
  const download = async (quotationId: string) => {
    try {
      const document = await mutation.mutateAsync(quotationId);
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
      toast.error("Impossible de générer la soumission PDF.");
    }
  };
  return {
    download,
    isPending: mutation.isPending,
    pendingQuotationId: mutation.variables,
  };
};
