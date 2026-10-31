import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openPdfInNewTab } from "@/shared/lib/openPdfInNewTab";
import { getApiErrorMessageAsync } from "@/shared/api/apiError";
import { toast } from "sonner";
import {
  cancelInvoice,
  createInvoiceFromOrder,
  getInvoice,
  getInvoiceDocument,
  getInvoices,
  issueInvoice,
  updateInvoice,
} from "../api/invoiceApi";
import type { Invoice, InvoiceStatus } from "../types";

export const INVOICES_QUERY_KEY = ["invoices"];

export const useInvoices = (status?: InvoiceStatus) =>
  useQuery({
    queryKey: [...INVOICES_QUERY_KEY, { status: status ?? null }],
    queryFn: () => getInvoices(status),
  });

export const useInvoice = (invoiceId: string | undefined) =>
  useQuery({
    queryKey: [...INVOICES_QUERY_KEY, invoiceId],
    queryFn: () => getInvoice(invoiceId!),
    enabled: Boolean(invoiceId),
  });

function useInvoiceMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<Invoice>,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (invoice) => {
      client.setQueryData([...INVOICES_QUERY_KEY, invoice.id], invoice);
      await client.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
  });
}

export const useCreateInvoice = () =>
  useInvoiceMutation(createInvoiceFromOrder);
export const useUpdateInvoice = () => useInvoiceMutation(updateInvoice);
export const useIssueInvoice = () => useInvoiceMutation(issueInvoice);
export const useCancelInvoice = () => useInvoiceMutation(cancelInvoice);

export const useInvoiceDocumentPreview = () => {
  const mutation = useMutation({ mutationFn: getInvoiceDocument });
  const open = async (invoiceId: string) => {
    try {
      const opened = await openPdfInNewTab(() =>
        mutation.mutateAsync(invoiceId),
      );
      if (!opened) {
        toast.error("Le navigateur a bloqué l’ouverture du PDF.", {
          description: "Autorisez les fenêtres contextuelles pour SAVIS.",
        });
      }
    } catch (error) {
      toast.error("Impossible de générer la facture PDF.", {
        description: await getApiErrorMessageAsync(error),
      });
    }
  };
  return {
    open,
    isPending: mutation.isPending,
    pendingInvoiceId: mutation.variables,
  };
};
