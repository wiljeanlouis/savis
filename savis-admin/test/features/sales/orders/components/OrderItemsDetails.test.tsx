import { OrderItemsDetails } from "@/features/sales/orders/components/OrderItemsDetails";
import type { OrderItem } from "@/features/sales/orders/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const item: OrderItem = {
  id: "item-1",
  productId: "product-1",
  productNameSnapshot: "Pâtés assortis",
  productType: "SINGLE_CHOICE_BUNDLE",
  imageUrl: "https://example.com/pates.jpg",
  quantity: 2,
  basePriceCents: 3000,
  unitPriceCents: 3150,
  lineTotalCents: 6300,
  purchaseModeId: "dozen",
  purchaseModeLabel: "Douzaine",
  purchaseModeQuantity: 12,
  allocationType: "CHOICE_ALLOCATION",
  rawKey: null,
  choiceSelections: [
    { choiceId: "chicken", choiceName: "Poulet", groupLabel: "Saveur" },
  ],
  choiceAllocations: [
    { choiceId: "chicken", choiceName: "Poulet", quantity: 6 },
    { choiceId: "beef", choiceName: "Boeuf", quantity: 6 },
  ],
  ingredientSelections: [
    {
      ingredientId: "spice",
      ingredientName: "Épices",
      quantity: 2,
      defaultQuantity: 1,
      extraPriceCents: 150,
    },
  ],
};

describe("OrderItemsDetails", () => {
  it("renders choice, allocation, ingredient and price snapshots", () => {
    render(<OrderItemsDetails items={[item]} />);

    expect(screen.getByText("Pâtés assortis")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Pâtés assortis" })).toHaveAttribute(
      "src",
      "https://example.com/pates.jpg",
    );
    expect(screen.getByText("Poulet × 6")).toBeInTheDocument();
    expect(screen.getByText("Boeuf × 6")).toBeInTheDocument();
    expect(screen.getByText(/Épices : 2/)).toHaveTextContent("1 extra");
    expect(screen.getByText(/63,00/)).toBeInTheDocument();
  });
});
