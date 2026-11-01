import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ImportResultAlert } from "@/features/sales/quote-requests/components/ImportResultAlert";
describe("ImportResultAlert", () => {
  it("affiche la raison du serveur pour chaque réception en échec", () => {
    render(
      <ImportResultAlert
        result={{
          fetched: 2,
          imported: 1,
          alreadyImported: 0,
          failed: 1,
          acknowledgmentFailed: 0,
          failures: [
            {
              externalId: "reception-1",
              code: "INVALID_OR_CONFLICTING_REQUEST",
              reason: "La date de l’événement est invalide",
            },
          ],
        }}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(
      within(alert).getByText("Importation terminée avec des erreurs"),
    ).toBeInTheDocument();
    expect(
      within(alert).getByText("La date de l’événement est invalide", {
        exact: false,
      }),
    ).toBeInTheDocument();
  });
  it("utilise aussi une alerte pour le succès et traduit les anciens codes sans raison", () => {
    const view = render(
      <ImportResultAlert
        result={{
          fetched: 1,
          imported: 1,
          alreadyImported: 0,
          failed: 0,
          acknowledgmentFailed: 0,
          failures: [],
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Importation terminée");
    view.rerender(
      <ImportResultAlert
        result={{
          fetched: 1,
          imported: 1,
          alreadyImported: 0,
          failed: 0,
          acknowledgmentFailed: 1,
          failures: [
            { externalId: "reception-1", code: "ACKNOWLEDGEMENT_FAILED" },
          ],
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "La synchronisation n’a pas pu être confirmée",
    );
  });
});
