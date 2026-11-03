import { describe, expect, it } from "vitest";
import { emptyQuotationDraft } from "@/features/sales/quotations/model/quotationDraft";
import { quotationDraftForStorage } from "@/features/sales/quotations/model/quotationDraftStorage";
describe("quotationDraftForStorage", () => {
  it("conserve les lignes commerciales sans persister les coordonnées ni les notes", () => {
    const draft = emptyQuotationDraft();
    draft.commercial.customerName = "Client privé";
    draft.commercial.customerPhone = "5145550123";
    draft.commercial.note = "Allergie privée";
    const stored = quotationDraftForStorage(draft);
    expect(JSON.stringify(stored)).not.toContain("Client privé");
    expect(JSON.stringify(stored)).not.toContain("Allergie privée");
    expect(stored.validUntil).toBe(draft.validUntil);
    expect(stored.commercial.items).toEqual(draft.commercial.items);
    expect(draft.commercial.customerName).toBe("Client privé");
  });
});
