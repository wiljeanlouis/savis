import type { CatalogProduct } from "@/features/catalog/types";
import {
  buildCreateOrderRequest,
  createAdminOrderItem,
  emptyAdminOrderDraft,
  estimateOrderTotalCents,
} from "@/features/orders/model/adminOrderDraft";
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
      customerPhone: " 514 ",
      items: [item],
    };

    const request = buildCreateOrderRequest(draft, [product]);

    expect(request.customerName).toBe("Ada");
    expect(request.items[0]).toMatchObject({
      productId: product.id,
      quantity: 3,
      purchaseModeCode: "unit",
      ingredients: [{ ingredientCode: "sprinkles", quantity: 2 }],
    });
    expect(estimateOrderTotalCents(draft, [product])).toBe(2850);
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
});
