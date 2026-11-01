import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
describe("ApiErrorAlert", () => {
  it("affiche la raison Problem Details renvoyée par le serveur", () => {
    render(
      <ApiErrorAlert
        title="Création impossible"
        error={{
          response: {
            data: { title: "Conflit", detail: "La demande est clôturée" },
          },
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Création impossible");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "La demande est clôturée",
    );
  });
});
