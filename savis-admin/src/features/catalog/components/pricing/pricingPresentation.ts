import type { Money, ProductPricingAnalysis } from "../../types";

export const money = (value: Money | null | undefined) =>
  value == null
    ? "Non déterminable"
    : `${new Intl.NumberFormat("fr-CA", { style: "currency", currency: value.currency }).format(value.amount)} ${value.currency}`;
export const percent = (value: number | null | undefined) =>
  value == null
    ? "Non déterminable"
    : new Intl.NumberFormat("fr-CA", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value);

export function monetaryMargin(result: ProductPricingAnalysis) {
  if (!result.complete) return null;
  const { cost, salePrice } = result;
  if (cost == null) return null;
  if (salePrice == null) return null;
  if (cost.currency !== salePrice.currency) return null;
  return {
    amount: salePrice.amount - cost.amount,
    currency: salePrice.currency,
  };
}

export const pricingStatusLabels = {
  GOOD: "Marge cible atteinte",
  REVIEW: "Prix à revoir",
  LOSS: "Vente à perte",
  INCOMPLETE: "Analyse incomplète",
};
