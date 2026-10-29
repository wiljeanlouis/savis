import { BomCostAnalysis } from "@/features/bom/components/BomCostAnalysis";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { costing, missingCosting, money } from "../fixtures/costing";

const format = (amount: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" })
    .format(amount)
    .replace(/\s/g, " ");

describe("BomCostAnalysis", () => {
  it("shows summary and separate component/activity breakdowns with independent rounding", async () => {
    render(<BomCostAnalysis costing={costing} yieldUnit="portion" />);
    expect(
      screen.getByRole("region", { name: "Analyse des coûts" }),
    ).toBeVisible();
    const summary = screen.getByLabelText("Synthèse des coûts");
    expect(within(summary).getByText("Coût total")).toBeVisible();
    expect(within(summary).getAllByText(format(22.412666667))).toHaveLength(2);
    expect(within(summary).getByText("4 portion")).toBeVisible();
    expect(
      within(summary).getByText(`${format(22.412666667 / 4)} / portion`),
    ).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Composants" }),
    ).toHaveTextContent(format(5.246));
    expect(screen.getByRole("region", { name: "Activités" })).toHaveTextContent(
      format(17.166666667),
    );
    expect(
      screen.getByText(/la somme des sous-totaux affichés peut donc différer/),
    ).toBeVisible();
    const precision = screen.getByText("Précision des montants");
    await userEvent.click(precision);
    expect(
      within(precision.closest("details")!).getByText("5,246 $"),
    ).toBeVisible();
    expect(
      within(precision.closest("details")!).getByText("17,166666667 $"),
    ).toBeVisible();
  });

  it("explains missing costs and suppresses full and unit costs", () => {
    render(<BomCostAnalysis costing={missingCosting} yieldUnit="portion" />);
    expect(screen.getByText("Coût incomplet")).toBeVisible();
    expect(screen.getByText("Coût manquant")).toBeVisible();
    expect(screen.getByText("Taux horaire absent")).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Diagnostics de coût" }),
    ).toHaveTextContent("Préparation");
    expect(
      screen.getByText(/Un coût manquant n’est pas un coût nul/),
    ).toBeVisible();
    expect(screen.queryByText("Coût total")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Coût par unité produite"),
    ).not.toBeInTheDocument();
  });

  it("keeps exact offer provenance behind an accessible disclosure", async () => {
    render(<BomCostAnalysis costing={costing} yieldUnit="portion" />);
    const source = costing.components[0].source!;
    expect(screen.getByText("Offre sélectionnée")).toBeVisible();
    expect(screen.getAllByText(source.usedOfferId!)[0]).not.toBeVisible();
    expect(screen.getByText(source.observedAt!)).not.toBeVisible();
    const disclosure = screen.getByText("Provenance et détails — Farine");
    await userEvent.click(disclosure);
    expect(screen.getAllByText(source.usedOfferId!)[0]).toBeVisible();
    expect(screen.getByText(source.observedAt!)).toBeVisible();
    expect(screen.getByText("Prix du conditionnement")).toBeVisible();
    expect(screen.getByText("200 g")).toBeVisible();
    expect(
      screen.getByText("Taux horaire configuré : 25,75 $/h"),
    ).toBeVisible();
  });

  it("shows valid zero costs as known, including a zero unit cost", () => {
    render(
      <BomCostAnalysis
        costing={{
          ...costing,
          totalCost: money(0),
          knownSubtotal: money(0),
          componentSubtotal: money(0),
          activitySubtotal: money(0),
          activities: [],
          components: [{ ...costing.components[0], amount: money(0) }],
        }}
        yieldUnit="portion"
      />,
    );
    expect(screen.getByText("Coût connu · nul")).toBeVisible();
    expect(screen.getByText(`${format(0)} / portion`)).toBeVisible();
    expect(screen.queryByText("Coût manquant")).not.toBeInTheDocument();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "does not divide by an invalid yield (%s)",
    (yieldQuantity) => {
      render(
        <BomCostAnalysis
          costing={{ ...costing, yieldQuantity }}
          yieldUnit="portion"
        />,
      );
      expect(
        screen.queryByText("Coût par unité produite"),
      ).not.toBeInTheDocument();
    },
  );

  it("retains both selected and fallback offer identities in secondary provenance", async () => {
    const selected = "fc73e7f9-f730-4236-90c7-b3ca75489ae8";
    render(
      <BomCostAnalysis
        costing={{
          ...costing,
          components: [
            {
              ...costing.components[0],
              source: {
                ...costing.components[0].source!,
                selectedOfferId: selected,
              },
            },
          ],
        }}
        yieldUnit="portion"
      />,
    );
    expect(screen.getByText("Offre compatible la moins chère")).toBeVisible();
    expect(screen.getByText(selected)).not.toBeVisible();
    await userEvent.click(screen.getByText("Provenance et détails — Farine"));
    expect(screen.getByText(selected)).toBeVisible();
    expect(
      screen.getByText(costing.components[0].source!.usedOfferId!),
    ).toBeVisible();
  });

  it("preserves nonblocking warnings even when the cost is complete", () => {
    render(
      <BomCostAnalysis
        costing={{
          ...costing,
          diagnostics: [
            {
              code: "SELECTED_OFFER_UNAVAILABLE",
              source: "Farine",
              message: "Offre indisponible; dernier prix observé conservé",
              blocking: false,
            },
          ],
        }}
        yieldUnit="portion"
      />,
    );
    expect(screen.getByText("Coût complet")).toBeVisible();
    expect(screen.getByText("À vérifier")).toBeVisible();
    expect(
      screen.getByText("Offre indisponible; dernier prix observé conservé"),
    ).toBeVisible();
  });
});
