import {
  addSafeCents,
  dollarsToSafeCents,
  multiplySafeCents,
} from "@/shared/lib/money";
import { describe, expect, it } from "vitest";

describe("browser monetary guards", () => {
  it("converts dollars to cents using the existing rounded preview", () => {
    expect(dollarsToSafeCents(12.99)).toBe(1299);
    expect(dollarsToSafeCents(12.995)).toBe(1300);
  });

  it("rejects non-finite and unsafe results", () => {
    expect(() => dollarsToSafeCents(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => dollarsToSafeCents(Number.MAX_SAFE_INTEGER)).toThrow(
      "plage d’entiers sûre",
    );
    expect(() => addSafeCents(Number.MAX_SAFE_INTEGER, 1)).toThrow(
      "plage d’entiers sûre",
    );
    expect(() => multiplySafeCents(Number.MAX_SAFE_INTEGER, 2)).toThrow(
      "plage d’entiers sûre",
    );
  });
});
