import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const useInvoiceDocumentDownload = () => {
  const mutation = useMutation({ mutationFn: getInvoiceDocument });
  const download = async (invoiceId: string) => {
    try {
      const document = await mutation.mutateAsync(invoiceId);
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
      toast.error("Impossible de générer la facture PDF.");
    }
  };
  return {
    download,
    isPending: mutation.isPending,
    pendingInvoiceId: mutation.variables,
  };
};
