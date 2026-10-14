import {
  formatCanadianPostalInput,
  formatOrderAddress,
  formatPhoneForDisplay,
  normalizeCanadianPostalCode,
  normalizePhone,
  phoneHref,
} from "@/features/orders/model/contactFormat";
import { describe, expect, it } from "vitest";

describe("contactFormat", () => {
  it("normalizes and presents Canadian phone numbers consistently", () => {
    expect(normalizePhone("514-555-0100")).toBe("+15145550100");
    expect(formatPhoneForDisplay("+15145550100")).toBe("(514) 555-0100");
    expect(phoneHref("514 555 0100")).toBe("+15145550100");
    expect(() => normalizePhone("123-456-7890")).toThrow("invalide");
  });

  it("normalizes Canadian postal codes and rejects malformed values", () => {
    expect(formatCanadianPostalInput("j2b1v7")).toBe("J2B 1V7");
    expect(normalizeCanadianPostalCode("j2b-1v7")).toBe("J2B 1V7");
    expect(() => normalizeCanadianPostalCode("J2B EV7")).toThrow(
      "format A1A 1A1",
    );
  });

  it("formats the city, province and postal code as one locality line", () => {
    expect(
      formatOrderAddress({
        line1: "12, rue la gloire",
        line2: null,
        city: "Drummondville",
        province: "QC",
        postalCode: "J2B 1V7",
      }),
    ).toBe("12, rue la gloire, Drummondville, QC J2B 1V7");
  });
});
