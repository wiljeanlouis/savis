import { BomCostSummary } from "@/features/bom/components/BomCostSummary";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { costing, missingCosting, money } from "../fixtures/costing";

const format = (amount: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" })
    .format(amount)
    .replace(/\s/g, " ");

describe("BomCostSummary", () => {
  it("shows the complete total without detailed costs", () => {
    render(<BomCostSummary costing={costing} />);
    expect(screen.getByText("Coût complet")).toBeVisible();
    expect(screen.getByText("Coût total")).toBeVisible();
    expect(screen.getByText(format(costing.totalCost!.amount))).toBeVisible();
    expect(screen.queryByText("Farine")).not.toBeInTheDocument();
    expect(screen.queryByText("Sous-total connu")).not.toBeInTheDocument();
  });

  it("labels the incomplete subtotal without implying a full total", () => {
    render(<BomCostSummary costing={missingCosting} />);
    expect(screen.getByText("Coût incomplet")).toBeVisible();
    expect(screen.getByText("Sous-total connu")).toBeVisible();
    expect(screen.getByText(format(5.246))).toBeVisible();
    expect(screen.queryByText("Coût total")).not.toBeInTheDocument();
    expect(screen.queryByText("Taux horaire absent")).not.toBeInTheDocument();
  });

  it("distinguishes a known zero from no evaluation", () => {
    const { rerender } = render(<BomCostSummary />);
    expect(screen.getByText("Coût non évalué")).toBeVisible();
    rerender(
      <BomCostSummary
        costing={{ ...costing, totalCost: money(0), knownSubtotal: money(0) }}
      />,
    );
    expect(screen.getByText("Coût complet")).toBeVisible();
    expect(screen.getByText(format(0))).toBeVisible();
  });
});
