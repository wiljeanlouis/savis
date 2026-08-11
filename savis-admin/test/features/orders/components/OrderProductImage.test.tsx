import { OrderProductImage } from "@/features/orders/components/OrderProductImage";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("OrderProductImage", () => {
  it("shows the snapshot image and falls back when loading fails", () => {
    render(
      <OrderProductImage
        imageUrl="https://example.com/cookie.jpg"
        productName="Biscuit"
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "Biscuit" }));

    expect(
      screen.getByRole("img", { name: "Aucune image pour Biscuit" }),
    ).toBeInTheDocument();
  });
});
