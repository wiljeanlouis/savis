import type { BomCosting, BomCostLine, BomPrice } from "../types";

export function formatBomMoney(
  value: BomPrice | null | undefined,
  precise = false,
) {
  if (!value || !Number.isFinite(value.amount)) return "—";
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: value.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: precise ? 20 : 2,
  }).format(value.amount);
}

export const formatBomQuantity = (quantity: number, unit: string) =>
  `${new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 10 }).format(quantity)} ${unit}`.trim();

export const formatBomDuration = (minutes: number) =>
  `${new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 20 }).format(minutes)} min`;

const activityLabels: Record<string, string> = {
  PREP: "Préparation",
  COOK: "Cuisson",
  ASSEMBLY: "Assemblage",
  PACKAGING: "Emballage",
  INSTALLATION: "Installation",
  DELIVERY: "Livraison",
  CLEANUP: "Nettoyage",
  CUSTOM: "Autre",
};

export const costActivityLabel = (label: string) =>
  activityLabels[label] ?? label;

/** Presentation groups shared by the breakdown and table; no new cost categories are calculated. */
export interface BomCostCategory {
  id: string;
  label: string;
  subtotal: BomPrice;
  lines: BomCostLine[];
  activities?: boolean;
  color: string;
}

export function bomCostCategories(costing: BomCosting): BomCostCategory[] {
  return [
    {
      id: "components",
      label: "Composants",
      subtotal: costing.componentSubtotal,
      lines: costing.components,
      color: "bg-primary",
    },
    {
      id: "activities",
      label: "Activités",
      subtotal: costing.activitySubtotal,
      lines: costing.activities,
      activities: true,
      color: "bg-teal-500",
    },
  ];
}

export function costLineIssue(line: BomCostLine): string | null {
  const labels: Record<string, string> = {
    ACTIVITY_RATE_MISSING: "Taux horaire absent",
    SELECTED_OFFER_UNAVAILABLE: "Offre indisponible",
    INCOMPATIBLE_UNITS: "Unité incompatible",
    OFFER_PRICE_MISSING: "Prix absent",
    INVALID_PACKAGE: "Conditionnement invalide",
    OFFER_NOT_FOUND: "Offre introuvable",
  };
  const diagnostic =
    line.diagnostics.find((issue) => issue.blocking) ?? line.diagnostics[0];
  if (diagnostic && labels[diagnostic.code]) return labels[diagnostic.code];
  if (line.status === "MISSING") return "Coût manquant";
  return diagnostic ? "À vérifier" : null;
}
