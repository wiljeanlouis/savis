import type { BomPrice } from "../types";

export function formatBomMoney(
  value: BomPrice | null | undefined,
  precise = false,
) {
  if (!value || !Number.isFinite(value.amount)) return "—";
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: value.currency,
    ...(precise ? { maximumFractionDigits: 20 } : {}),
  }).format(value.amount);
}

export const formatBomQuantity = (quantity: number, unit: string) =>
  `${new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 10 }).format(quantity)} ${unit}`.trim();

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
