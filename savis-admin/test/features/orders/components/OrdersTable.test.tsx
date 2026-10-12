import { OrdersTable } from "@/features/orders/components/OrdersTable";
import type { OrderSummary } from "@/features/orders/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

describe("OrdersTable", () => {
  it("renders one stable product preview, the item count, and PDF downloads", async () => {
    const user = userEvent.setup();
    const onDownloadDocument = vi.fn();
    const order: OrderSummary = {
      id: "order-id",
      orderNumber: "ADM-00000001",
      source: "ADMIN",
      status: "NEW",
      customerName: "Ada",
      customerPhone: "514",
      customerEmail: null,
      itemCount: 4,
      itemPreviews: [
        {
          id: "item-1",
          productName: "Biscuit",
          imageUrl: "https://example.com/cookie.jpg",
        },
        { id: "item-2", productName: "Gâteau", imageUrl: null },
        { id: "item-3", productName: "Pâté", imageUrl: null },
      ],
      totalCents: 2500,
      placedAt: "2026-08-08T15:00:00Z",
      importedAt: "2026-08-08T15:00:00Z",
    };

    render(
      <MemoryRouter>
        <OrdersTable orders={[order]} onDownloadDocument={onDownloadDocument} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("img", { name: "Biscuit" })).toHaveAttribute(
      "src",
      "https://example.com/cookie.jpg",
    );
    expect(screen.getByText("4 articles")).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Aucune image pour Gâteau" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Documents PDF de ADM-00000001",
      }),
    );
    await user.click(
      screen.getByRole("menuitem", { name: "Télécharger la soumission" }),
    );

    expect(onDownloadDocument).toHaveBeenCalledWith("order-id", "quote");
  });
});
