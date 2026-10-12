import { OrderRequirementReportCard } from "@/features/orders/components/OrderRequirementReportCard";
import type { OrderRequirementReport } from "@/features/orders/types";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

const report: OrderRequirementReport = {
  orderId: "order-1",
  orderNumber: "WEB-00000001",
  generatedAt: "2026-08-08T15:00:00Z",
  complete: true,
  warnings: [],
  requirements: [
    {
      componentKey: "farine:g",
      componentName: "farine",
      requiredQuantity: 2,
      unit: "kg",
      sourcingInformation: {
        supplierProductId: "offer-1",
        productName: "Sac de farine",
        imageUrl: "https://example.com/flour.jpg",
        brandOrLabel: "Sans Nom",
        supplierName: "Maxi",
        packageSize: 5,
        packageUnit: "kg",
        currentPrice: { amount: 6, currency: "CAD" },
        observedAt: "2026-08-08T12:00:00",
      },
      sources: [
        {
          bomId: "bom-1",
          bomName: "Pâté poulet",
          orderItemId: "item-1",
          productName: "Pâtés assortis",
          configurationSource: "Poulet",
          quantityContribution: 2,
          unit: "kg",
        },
      ],
      onHandQuantity: null,
      missingQuantity: null,
      purchaseQuantity: null,
      estimatedPurchaseCost: null,
    },
  ],
};

describe("OrderRequirementReportCard", () => {
  it("renders aggregated needs, current sourcing and traceable BOM sources", () => {
    render(
      <MemoryRouter>
        <OrderRequirementReportCard
          report={report}
          isLoading={false}
          isError={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Besoins de production")).toBeInTheDocument();
    expect(screen.getByText("2 kg")).toBeInTheDocument();
    expect(screen.getByText("Sac de farine")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Sac de farine" })).toHaveAttribute(
      "src",
      "https://example.com/flour.jpg",
    );
    expect(screen.getByText("Sans Nom · Maxi")).toBeInTheDocument();
    expect(screen.getByText(/6,00/)).toBeInTheDocument();
    expect(screen.getByText("Pâté poulet")).toHaveAttribute(
      "href",
      "/boms/bom-1",
    );
  });
});
