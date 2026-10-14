import type { SupplyOfferPackageSize, SupplyOfferPrice } from "./types";

export function formatSupplyOfferPrice(price: SupplyOfferPrice | null) {
  if (!price || !Number.isFinite(price.amount) || !price.currency) return "—";

  try {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: price.currency,
    }).format(price.amount);
  } catch {
    return `${price.amount} ${price.currency}`;
  }
}

export function formatSupplyOfferPackage(
  packageSize: SupplyOfferPackageSize | null,
) {
  if (!packageSize || !Number.isFinite(packageSize.value)) return "—";
  return `${new Intl.NumberFormat("fr-CA", {
    maximumFractionDigits: 6,
  }).format(packageSize.value)} ${packageSize.unit}`;
}

export function formatSupplyOfferDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "—";

  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
