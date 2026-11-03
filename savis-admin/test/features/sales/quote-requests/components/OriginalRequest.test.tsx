import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OriginalRequest } from "@/features/sales/quote-requests/components/OriginalRequest";
describe("OriginalRequest", () => {
  it("affiche les contraintes originales sans interpréter le HTML", () => {
    const { container } = render(
      <OriginalRequest
        payload={JSON.stringify({
          event_details: { allergies: "<img src=x onerror=alert(1)>" },
          items: [],
        })}
      />,
    );
    expect(screen.getAllByText(/<img src=x/).length).toBeGreaterThan(0);
    expect(container.querySelector("img")).toBeNull();
  });
});
