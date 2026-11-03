import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";
import type { OrderAddress } from "../types";

const CANADIAN_POSTAL_CODE =
  /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] \d[ABCEGHJ-NPRSTV-Z]\d$/;

export const CANADIAN_PROVINCES = [
  ["AB", "Alberta"],
  ["BC", "Colombie-Britannique"],
  ["MB", "Manitoba"],
  ["NB", "Nouveau-Brunswick"],
  ["NL", "Terre-Neuve-et-Labrador"],
  ["NS", "Nouvelle-Écosse"],
  ["NT", "Territoires du Nord-Ouest"],
  ["NU", "Nunavut"],
  ["ON", "Ontario"],
  ["PE", "Île-du-Prince-Édouard"],
  ["QC", "Québec"],
  ["SK", "Saskatchewan"],
  ["YT", "Yukon"],
] as const;

export function formatPhoneInput(value: string) {
  return value.trim() ? new AsYouType("CA").input(value) : "";
}

export function normalizePhone(value: string) {
  const phone = parsePhoneNumberFromString(value, "CA");
  if (!phone || phone.ext || !phone.isValid()) {
    throw new Error("Le numéro de téléphone est invalide.");
  }
  return phone.number;
}

export function formatPhoneForDisplay(value: string) {
  const phone = parsePhoneNumberFromString(value, "CA");
  return phone?.isValid() ? phone.formatNational() : value;
}

export function phoneHref(value: string) {
  const phone = parsePhoneNumberFromString(value, "CA");
  return phone?.isValid() ? phone.number : value;
}

export function formatCanadianPostalInput(value: string) {
  const compact = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  return compact.length > 3
    ? `${compact.slice(0, 3)} ${compact.slice(3)}`
    : compact;
}

export function normalizeCanadianPostalCode(value: string) {
  const formatted = formatCanadianPostalInput(value);
  if (formatted && !CANADIAN_POSTAL_CODE.test(formatted)) {
    throw new Error(
      "Le code postal canadien doit respecter le format A1A 1A1.",
    );
  }
  return formatted;
}

export function formatOrderAddress(address: OrderAddress | null) {
  if (!address) return "—";
  const region = [address.province, address.postalCode]
    .filter(Boolean)
    .join(" ");
  const locality = address.city
    ? region
      ? `${address.city}, ${region}`
      : address.city
    : region;
  return (
    [address.line1, address.line2, locality].filter(Boolean).join(", ") || "—"
  );
}
