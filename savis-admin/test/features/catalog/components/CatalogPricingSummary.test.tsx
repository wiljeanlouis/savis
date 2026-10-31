import { CatalogPricingSummary } from "@/features/catalog/components/CatalogPricingSummary";
import type { ProductPricingAnalysis } from "@/features/catalog/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const result: ProductPricingAnalysis = {
  analysisType: "CONFIGURATION",
  analyzedQuantity: 12,
  salePrice: { amount: 30, currency: "CAD" },
  cost: null,
  unitCost: null,
  knownSubtotal: { amount: 4, currency: "CAD" },
  actualMarginRate: null,
  targetMarginRate: 0.3,
  recommendedPrice: null,
  status: "INCOMPLETE",
  complete: false,
  missingBomIds: ["bom-1"],
  diagnostics: [
    {
      bomId: "bom-1",
      code: "OFFER_PRICE_MISSING",
      source: "farine",
      message: "Prix de l'offre absent",
      blocking: true,
    },
  ],
};

describe("CatalogPricingSummary", () => {
  it("shows known costs and diagnostics without a full margin or recommendation", () => {
    render(<CatalogPricingSummary result={result} />);
    expect(screen.getByText("Coût incomplet")).toBeInTheDocument();
    expect(screen.getByText("Sous-total connu")).toBeInTheDocument();
    expect(screen.getByText("Incomplète")).toBeInTheDocument();
    expect(screen.getByText("Indisponible")).toBeInTheDocument();
    expect(
      screen.getByText("farine : Prix de l'offre absent"),
    ).toBeInTheDocument();
  });

  it("preserves complete margin and recommended price", () => {
    render(
      <CatalogPricingSummary
        result={{
          ...result,
          complete: true,
          status: "GOOD",
          cost: { amount: 4, currency: "CAD" },
          unitCost: { amount: 4, currency: "CAD" },
          actualMarginRate: 0.4,
          recommendedPrice: { amount: 6.75, currency: "CAD" },
          diagnostics: [],
        }}
      />,
    );
    expect(screen.getByText("Coût complet")).toBeInTheDocument();
    expect(screen.getByText("40.0 %")).toBeInTheDocument();
    expect(screen.getByText(/6,75/)).toBeInTheDocument();
  });
});
