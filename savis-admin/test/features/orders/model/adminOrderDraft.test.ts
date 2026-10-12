import type { CatalogProduct } from "@/features/catalog/types";
import {
  adminOrderDraftFromOrder,
  buildCreateOrderRequest,
  buildUpdateOrderCustomerRequest,
  createAdminOrderItem,
  emptyAdminOrderDraft,
  estimateOrderTotalCents,
} from "@/features/orders/model/adminOrderDraft";
import type { Order } from "@/features/orders/types";
import { describe, expect, it } from "vitest";

const product: CatalogProduct = {
  id: "20000000-0000-4000-8000-000000000002",
  code: "COOKIE",
  slug: "cookie",
  name: "Biscuit personnalisé",
  description: "",
  productType: "INGREDIENT_CUSTOMIZATION",
  category: "TASTING",
  subcategory: null,
  productBoms: [],
  targetMarginRate: 0.3,
  imageUrl: "/cookie.jpg",
  gallery: [],
  availabilityNote: "Disponible",
  available: true,
  published: true,
  displayOrder: 0,
  purchaseModes: [
    {
      id: "mode-id",
      code: "unit",
      label: "Unité",
      quantity: 1,
      price: { amount: 8, currency: "CAD" },
      allocationType: "NONE",
      active: true,
      displayOrder: 0,
    },
  ],
  choiceGroup: null,
  ingredientOptions: [
    {
      id: "ingredient-id",
      code: "sprinkles",
      name: "Confettis",
      bomId: null,
      defaultQuantity: 1,
      minQuantity: 0,
      maxQuantity: 3,
      extraPrice: { amount: 1.5, currency: "CAD" },
      active: true,
      displayOrder: 0,
    },
  ],
};

describe("adminOrderDraft", () => {
  it("builds the minimal server command and estimates configured extras", () => {
    const item = createAdminOrderItem(product);
    item.quantity = 3;
    item.ingredients.sprinkles = 2;
    const draft = {
      ...emptyAdminOrderDraft(),
      customerName: " Ada ",
      customerPhone: " (514) 555-0100 ",
      customerAddress: {
        line1: " 123 rue Principale ",
        line2: "",
        city: " Montréal ",
        province: " QC ",
        postalCode: " H1H 1H1 ",
      },
      discountCents: 200,
      deliveryFeeCents: 350,
      items: [item],
    };

    const request = buildCreateOrderRequest(draft, [product]);

    expect(request.customerName).toBe("Ada");
    expect(request.customerPhone).toBe("+15145550100");
    expect(request.customerAddress).toEqual({
      line1: "123 rue Principale",
      line2: null,
      city: "Montréal",
      province: "QC",
      postalCode: "H1H 1H1",
    });
    expect(request.items[0]).toMatchObject({
      productId: product.id,
      quantity: 3,
      purchaseModeCode: "unit",
      ingredients: [{ ingredientCode: "sprinkles", quantity: 2 }],
    });
    expect(estimateOrderTotalCents(draft, [product])).toBe(3000);
  });

  it("rejects an empty order", () => {
    expect(() =>
      buildCreateOrderRequest(
        {
          ...emptyAdminOrderDraft(),
          customerName: "Ada",
          customerPhone: "514",
        },
        [product],
      ),
    ).toThrow("Ajoutez au moins un produit");
  });

  it("restores an editable draft from saved order snapshots", () => {
    const order = {
      id: "order-1",
      orderNumber: "ADM-00000001",
      source: "ADMIN",
      status: "NEW",
      customerName: "Ada",
      customerPhone: "+15145550100",
      customerEmail: "ada@example.com",
      customerAddress: {
        line1: "123 rue Principale",
        line2: null,
        city: "Montréal",
        province: "QC",
        postalCode: "H1H 1H1",
      },
      note: "Sans noix",
      subtotalCents: 2400,
      discountCents: 200,
      deliveryFeeCents: 300,
      totalCents: 2500,
      externalOrderId: null,
      placedAt: "2026-10-12T12:00:00Z",
      importedAt: "2026-10-12T12:00:00Z",
      acceptedAt: null,
      inPreparationAt: null,
      readyAt: null,
      completedAt: null,
      cancelledAt: null,
      items: [
        {
          id: "item-1",
          productId: product.id!,
          productNameSnapshot: product.name,
          productType: "INGREDIENT_CUSTOMIZATION",
          imageUrl: product.imageUrl,
          quantity: 3,
          basePriceCents: 800,
          unitPriceCents: 950,
          lineTotalCents: 2850,
          purchaseModeId: "unit",
          purchaseModeLabel: "Unité",
          purchaseModeQuantity: 1,
          allocationType: "NONE",
          rawKey: null,
          choiceSelections: [],
          choiceAllocations: [],
          ingredientSelections: [
            {
              ingredientId: "sprinkles",
              ingredientName: "Confettis",
              quantity: 2,
              defaultQuantity: 1,
              extraPriceCents: 150,
            },
          ],
        },
      ],
    } satisfies Order;

    const draft = adminOrderDraftFromOrder(order);

    expect(draft).toMatchObject({
      customerName: "Ada",
      customerPhone: "(514) 555-0100",
      customerAddress: { line1: "123 rue Principale" },
      discountCents: 200,
      deliveryFeeCents: 300,
      items: [
        {
          key: "item-1",
          productId: product.id,
          purchaseModeCode: "unit",
          ingredients: { sprinkles: 2 },
        },
      ],
    });

    expect(buildUpdateOrderCustomerRequest(draft)).toEqual({
      customerName: "Ada",
      customerPhone: "+15145550100",
      customerEmail: "ada@example.com",
      customerAddress: {
        line1: "123 rue Principale",
        line2: null,
        city: "Montréal",
        province: "QC",
        postalCode: "H1H 1H1",
      },
      note: "Sans noix",
    });
  });
});
