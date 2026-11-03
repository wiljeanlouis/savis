import { emptyQuotationDraft, type QuotationDraft } from "./quotationDraft";
/** Preserve commercial work across reloads while keeping contact and free-text notes in memory. */
export function quotationDraftForStorage(
  draft: QuotationDraft,
): QuotationDraft {
  const empty = emptyQuotationDraft();
  return {
    ...draft,
    commercial: {
      ...draft.commercial,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerAddress: empty.commercial.customerAddress,
      note: "",
    },
  };
}
