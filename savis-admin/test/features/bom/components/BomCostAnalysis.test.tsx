import type { SubmitEvent } from "react";
import { BomCostAnalysis } from "@/features/bom/components/BomCostAnalysis";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { costing, missingCosting, money } from "../fixtures/costing";

const format = (amount: number, currency = "CAD") =>
  new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/\s/g, " ");

function renderAnalysis(value = costing) {
  return render(<BomCostAnalysis costing={value} yieldUnit="portion" />);
}

describe("BomCostAnalysis", () => {
  it("prioritizes the complete total and unit cost without repeating known statuses or technical precision", () => {
    const before = JSON.stringify(costing);
    renderAnalysis();
    const summary = screen.getByRole("region", { name: "Synthèse des coûts" });
    expect(within(summary).getByText("Coût total")).toBeVisible();
    expect(
      within(summary).queryByText("Sous-total connu"),
    ).not.toBeInTheDocument();
    expect(within(summary).getByText(format(22.412666667))).toBeVisible();
    const unitCost = within(summary).getByText(
      `${format(22.412666667 / 4)} / portion`,
    );
    expect(unitCost).toBeVisible();
    expect(unitCost).toHaveClass("whitespace-nowrap");
    expect(within(summary).getByText("4 portion")).toBeVisible();
    expect(screen.getAllByText("Coût complet")).toHaveLength(1);
    expect(screen.queryByText(/Coût connu/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Précision des montants"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("5,246 $")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByText(/De légers écarts peuvent apparaître/),
    ).toBeVisible();
    expect(JSON.stringify(costing)).toBe(before);
  });

  it("shows a compact three-column table grouped by components and activities with received subtotals", () => {
    renderAnalysis();
    const table = screen.getByRole("table", { name: "Postes de coût" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Poste", "Quantité / durée", "Coût"]);
    const components = within(table).getByRole("rowgroup", {
      name: "Composants",
    });
    expect(components).toHaveTextContent(format(5.246));
    expect(components).toHaveTextContent("100 g");
    expect(
      within(components).getByRole("button", {
        name: "Détails du poste : Farine",
      }),
    ).toBeVisible();
    const activities = within(table).getByRole("rowgroup", {
      name: "Activités",
    });
    expect(activities).toHaveTextContent(format(17.166666667));
    expect(activities).toHaveTextContent("40 min");
    expect(
      within(activities).getByRole("button", {
        name: "Détails du poste : Préparation",
      }),
    ).toBeVisible();
    expect(screen.getByLabelText("Synthèse des coûts")).toHaveTextContent(
      format(22.412666667),
    );
  });

  it("uses unrounded category amounts for proportions", () => {
    renderAnalysis();
    const breakdown = screen.getByRole("region", {
      name: "Répartition des coûts",
    });
    expect(breakdown).toHaveTextContent("23,4 %");
    expect(breakdown).toHaveTextContent("76,6 %");
    expect(breakdown).toHaveTextContent(format(5.246));
    expect(breakdown).toHaveTextContent(format(17.166666667));
  });

  it("calculates proportions before monetary display rounding", () => {
    renderAnalysis({
      ...costing,
      totalCost: money(0.008),
      knownSubtotal: money(0.008),
      componentSubtotal: money(0.003),
      activitySubtotal: money(0.005),
      components: [{ ...costing.components[0], amount: money(0.003) }],
      activities: [{ ...costing.activities[0], amount: money(0.005) }],
    });
    const breakdown = screen.getByRole("region", {
      name: "Répartition des coûts",
    });
    expect(breakdown).toHaveTextContent("37,5 %");
    expect(breakdown).toHaveTextContent("62,5 %");
    expect(breakdown).toHaveTextContent(format(0.003));
  });

  it("labels an incomplete subtotal, highlights the absent rate and provides its diagnostic on demand", async () => {
    renderAnalysis(missingCosting);
    const summary = screen.getByLabelText("Synthèse des coûts");
    expect(summary).toHaveTextContent("Sous-total connu");
    expect(summary).toHaveTextContent(format(5.246));
    expect(screen.getByText("Coût incomplet")).toBeVisible();
    expect(screen.getByText("Taux horaire absent")).toBeVisible();
    expect(screen.getByLabelText("Coût inconnu")).toBeVisible();
    expect(screen.queryByText("Coût total")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Coût par unité produite"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Un coût manquant n’est pas un coût nul/),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Les proportions concernent uniquement les coûts connus.",
      ),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Détails du poste : Préparation" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Préparation" });
    expect(
      within(dialog).getByRole("region", { name: "Diagnostics de coût" }),
    ).toHaveTextContent("Taux horaire absent");
    expect(within(dialog).getByText("Coût manquant")).toBeVisible();
  });

  it("opens and closes provenance by keyboard, preserves all references and restores focus", async () => {
    const submit = vi.fn((event: SubmitEvent<HTMLFormElement>) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={submit}>
        <BomCostAnalysis costing={costing} yieldUnit="portion" />
      </form>,
    );
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", {
      name: "Détails du poste : Farine",
    });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: "Farine" });
    const source = costing.components[0].source!;
    expect(dialog).toHaveAttribute("id", trigger.getAttribute("aria-controls"));
    expect(within(dialog).getByText("Offre sélectionnée")).toBeVisible();
    expect(
      within(dialog).getByText(format(source.packagePrice!.amount)),
    ).toBeVisible();
    expect(within(dialog).getByText("200 g")).toBeVisible();
    expect(
      within(dialog).getAllByText(source.usedOfferId!)[0],
    ).not.toBeVisible();
    expect(within(dialog).getByText(source.observedAt!)).not.toBeVisible();
    await user.click(within(dialog).getByText("Informations techniques"));
    expect(within(dialog).getAllByText(source.usedOfferId!)[0]).toBeVisible();
    expect(within(dialog).getByText(source.observedAt!)).toBeVisible();
    expect(within(dialog).getByText("5,246 $")).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(submit).not.toHaveBeenCalled();
  });

  it("keeps fallback offer references and supports explicit closing and activity rate inspection", async () => {
    const selected = "fc73e7f9-f730-4236-90c7-b3ca75489ae8";
    renderAnalysis({
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
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Détails du poste : Farine" }),
    );
    let dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Sélection automatique/)).toBeVisible();
    await userEvent.click(within(dialog).getByText("Informations techniques"));
    expect(within(dialog).getByText(selected)).toBeVisible();
    expect(
      within(dialog).getByText(costing.components[0].source!.usedOfferId!),
    ).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Fermer" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Détails du poste : Préparation" }),
    );
    dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Taux horaire configuré")).toBeVisible();
    expect(within(dialog).getAllByText("25,75 $/h")[0]).toBeVisible();
  });

  it("shows known zero amounts without unknown markers or invalid distribution percentages", () => {
    renderAnalysis({
      ...costing,
      totalCost: money(0),
      knownSubtotal: money(0),
      componentSubtotal: money(0),
      activitySubtotal: money(0),
      activities: [],
      components: [{ ...costing.components[0], amount: money(0) }],
    });
    expect(screen.getByText(`${format(0)} / portion`)).toBeVisible();
    expect(screen.getByText("Coût complet")).toBeVisible();
    expect(screen.queryByLabelText("Coût inconnu")).not.toBeInTheDocument();
    const components = screen.getByRole("rowgroup", { name: "Composants" });
    expect(within(components).getAllByText(format(0))).toHaveLength(2);
    expect(screen.getByText("Aucun coût connu à répartir.")).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Répartition des coûts" }),
    ).not.toHaveTextContent(/NaN|Infinity/);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "does not divide by an invalid yield (%s)",
    (yieldQuantity) => {
      renderAnalysis({ ...costing, yieldQuantity });
      expect(
        screen.queryByText("Coût par unité produite"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Rendement invalide")).toBeVisible();
    },
  );

  it.each([
    ["SELECTED_OFFER_UNAVAILABLE", "Offre indisponible"],
    ["INCOMPATIBLE_UNITS", "Unité incompatible"],
  ])(
    "highlights problematic lines (%s) without hiding their provenance",
    async (code, label) => {
      const diagnostic = {
        code,
        source: "Farine",
        message: "Explication du problème",
        blocking: false,
      };
      renderAnalysis({
        ...costing,
        diagnostics: [diagnostic],
        components: [{ ...costing.components[0], diagnostics: [diagnostic] }],
      });
      expect(screen.getByText(label)).toBeVisible();
      expect(screen.getByText("Coût complet")).toBeVisible();
      expect(
        screen.queryByText("Explication du problème"),
      ).not.toBeInTheDocument();
      await userEvent.click(
        screen.getByRole("button", { name: "Détails du poste : Farine" }),
      );
      expect(screen.getByText(/Explication du problème/)).toBeVisible();
    },
  );

  it("preserves general diagnostics outside the line details", () => {
    renderAnalysis({
      ...costing,
      diagnostics: [
        {
          code: "GENERAL_WARNING",
          source: "Composition",
          message: "Vérification nécessaire",
          blocking: false,
        },
      ],
    });
    expect(
      screen.getByRole("region", { name: "Diagnostics de coût" }),
    ).toHaveTextContent("Vérification nécessaire");
  });

  it("formats monetary values with two decimals in their own currency", () => {
    renderAnalysis({
      ...costing,
      totalCost: { amount: 12.3456, currency: "EUR" },
    });
    expect(screen.getByLabelText("Synthèse des coûts")).toHaveTextContent(
      format(12.3456, "EUR"),
    );
  });

  it("handles an unavailable valuation", () => {
    render(<BomCostAnalysis yieldUnit="portion" />);
    expect(screen.getByText("Coût non évalué")).toBeVisible();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
