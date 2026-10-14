import type { AdminOrderDraft } from "@/features/orders/model/adminOrderDraft";
import {
  buildCreateOrderRequest,
  emptyAdminOrderDraft,
} from "@/features/orders/model/adminOrderDraft";
import type { CatalogProduct } from "@/features/catalog/types";
import { formatPhoneForDisplay } from "@/features/orders/model/contactFormat";
import type { Quotation, SaveQuotationRequest } from "../types";

export interface QuotationDraft {
  commercial: AdminOrderDraft;
  validUntil: string;
}

export const emptyQuotationDraft = (): QuotationDraft => ({
  commercial: emptyAdminOrderDraft(),
  validUntil: addDays(new Date(), 30),
});

export function quotationDraftFromQuotation(
  quotation: Quotation,
): QuotationDraft {
  return {
    commercial: {
      customerName: quotation.customerName,
      customerPhone: formatPhoneForDisplay(quotation.customerPhone),
      customerEmail: quotation.customerEmail ?? "",
      customerAddress: {
        line1: quotation.customerAddress?.line1 ?? "",
        line2: quotation.customerAddress?.line2 ?? "",
        city: quotation.customerAddress?.city ?? "",
        province: quotation.customerAddress?.province ?? "",
        postalCode: quotation.customerAddress?.postalCode ?? "",
      },
      note: quotation.note ?? "",
      discountCents: quotation.discountCents,
      deliveryFeeCents: quotation.deliveryFeeCents,
      items: quotation.items.map((item) => ({
        key: item.id,
        productId: item.productId,
        quantity: item.quantity,
        purchaseModeCode: item.purchaseModeId ?? "",
        choiceCode: item.choiceSelections[0]?.choiceId ?? "",
        allocations: Object.fromEntries(
          item.choiceAllocations.map((value) => [
            value.choiceId,
            value.quantity,
          ]),
        ),
        ingredients: Object.fromEntries(
          item.ingredientSelections.map((value) => [
            value.ingredientId,
            value.quantity,
          ]),
        ),
      })),
    },
    validUntil: quotation.validUntil,
  };
}

export function buildSaveQuotationRequest(
  draft: QuotationDraft,
  products: CatalogProduct[],
): SaveQuotationRequest {
  if (!draft.validUntil) {
    throw new Error("La date de validité est requise.");
  }
  if (draft.commercial.items.length === 0) {
    throw new Error("Ajoutez au moins un produit à la soumission.");
  }
  const commercial = buildCreateOrderRequest(draft.commercial, products);
  return { ...commercial, validUntil: draft.validUntil };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
