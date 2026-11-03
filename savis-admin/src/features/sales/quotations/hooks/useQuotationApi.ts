import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openPdfInNewTab } from "@/shared/lib/openPdfInNewTab";
import { getApiErrorMessageAsync } from "@/shared/api/apiError";
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

export const useQuotationDocumentPreview = () => {
  const mutation = useMutation({ mutationFn: getQuotationDocument });
  const open = async (quotationId: string) => {
    try {
      const opened = await openPdfInNewTab(() =>
        mutation.mutateAsync(quotationId),
      );
      if (!opened) {
        toast.error("Le navigateur a bloqué l’ouverture du PDF.", {
          description: "Autorisez les fenêtres contextuelles pour SAVIS.",
        });
      }
    } catch (error) {
      toast.error("Impossible de générer la soumission PDF.", {
        description: await getApiErrorMessageAsync(error),
      });
    }
  };
  return {
    open,
    isPending: mutation.isPending,
    pendingQuotationId: mutation.variables,
  };
};
