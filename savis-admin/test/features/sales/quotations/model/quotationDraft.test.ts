import type { CatalogProduct } from "@/features/catalog/types";
import { createAdminOrderItem } from "@/features/sales/orders/model/adminOrderDraft";
import {
  buildSaveQuotationRequest,
  emptyQuotationDraft,
  quotationDraftFromQuotation,
} from "@/features/sales/quotations/model/quotationDraft";
import type { Quotation } from "@/features/sales/quotations/types";
import { describe, expect, it } from "vitest";

const service: CatalogProduct = {
  id: "20000000-0000-4000-8000-000000000002",
  code: "INSTALL",
  slug: "installation",
  name: "Installation personnalisée",
  description: "",
  commercialType: "SERVICE",
  productType: "STANDARD",
  category: "DECORATION",
  subcategory: null,
  productBoms: [],
  targetMarginRate: 0.3,
  imageUrl: "/installation.jpg",
  gallery: [],
  availabilityNote: "Disponible",
  available: true,
  published: true,
  displayOrder: 0,
  purchaseModes: [
    {
      id: "mode-id",
      code: "service",
      label: "Service",
      quantity: 1,
      price: { amount: 150, currency: "CAD" },
      allocationType: "NONE",
      active: true,
      displayOrder: 0,
    },
  ],
  choiceGroup: null,
  ingredientOptions: [],
};

describe("quotationDraft", () => {
  it("builds a quotation request for a service without a BOM", () => {
    const draft = emptyQuotationDraft();
    draft.validUntil = "2026-11-30";
    draft.commercial.customerName = "Ada";
    draft.commercial.customerPhone = "514 555-0100";
    draft.commercial.items = [createAdminOrderItem(service)];

    const request = buildSaveQuotationRequest(draft, [service]);

    expect(request.validUntil).toBe("2026-11-30");
    expect(request.items).toEqual([
      {
        productId: service.id,
        quantity: 1,
        purchaseModeCode: "service",
        choiceCode: null,
        allocations: [],
        ingredients: [],
      },
    ]);
  });

  it("restores editable fields from immutable quotation snapshots", () => {
    const quotation = {
      id: "quotation-1",
      quotationNumber: "SOU-00000001",
      status: "DRAFT",
      customerName: "Ada",
      customerPhone: "+15145550100",
      customerEmail: null,
      customerAddress: null,
      validUntil: "2026-11-30",
      note: null,
      subtotalCents: 15000,
      discountCents: 0,
      deliveryFeeCents: 0,
      totalCents: 15000,
      createdAt: "2026-10-12T15:00:00Z",
      updatedAt: "2026-10-12T15:00:00Z",
      sentAt: null,
      acceptedAt: null,
      rejectedAt: null,
      convertedOrderId: null,
      items: [
        {
          id: "item-1",
          productId: service.id!,
          productNameSnapshot: service.name,
          commercialType: "SERVICE",
          productType: "STANDARD",
          imageUrl: service.imageUrl,
          quantity: 1,
          basePriceCents: 15000,
          unitPriceCents: 15000,
          lineTotalCents: 15000,
          purchaseModeId: "service",
          purchaseModeLabel: "Service",
          purchaseModeQuantity: 1,
          allocationType: "NONE",
          rawKey: null,
          choiceSelections: [],
          choiceAllocations: [],
          ingredientSelections: [],
        },
      ],
    } satisfies Quotation;

    const draft = quotationDraftFromQuotation(quotation);

    expect(draft.validUntil).toBe("2026-11-30");
    expect(draft.commercial.items[0]).toMatchObject({
      productId: service.id,
      purchaseModeCode: "service",
    });
  });
});
