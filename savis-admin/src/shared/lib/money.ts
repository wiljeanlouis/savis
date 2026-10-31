const UNSAFE_MONETARY_VALUE =
  "Le montant dépasse la plage d’entiers sûre du navigateur.";

/** Converts a dollar amount to cents using the UI preview's HALF_UP rule. */
export function dollarsToSafeCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error("Le montant doit être un nombre fini.");
  }
  return requireSafeCents(Math.round(amount * 100));
}

/** Adds cent amounts without silently leaving JavaScript's safe integer range. */
export function addSafeCents(...amounts: number[]): number {
  return amounts.reduce(
    (total, amount) => requireSafeCents(total + requireSafeCents(amount)),
    0,
  );
}

/** Multiplies a cent amount without silently losing integer precision. */
export function multiplySafeCents(amount: number, quantity: number): number {
  return requireSafeCents(
    requireSafeCents(amount) * requireSafeCents(quantity),
  );
}

/** Validates a value that is already expressed in cents. */
export function requireSafeCents(amount: number): number {
  if (!Number.isSafeInteger(amount)) {
    throw new Error(UNSAFE_MONETARY_VALUE);
  }
  return amount;
}
