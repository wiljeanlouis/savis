import { SalesImportAlert } from "@/features/sales/components/SalesImportAlert";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

describe("SalesImportAlert", () => {
  it("combines both import results into a single alert", () => {
    render(
      <SalesImportAlert
        requestResult={{
          fetched: 2,
          imported: 1,
          alreadyImported: 1,
          failed: 0,
          acknowledgmentFailed: 0,
          failures: [],
        }}
        requestError={null}
        orderResult={{
          fetchedCount: 3,
          importedCount: 2,
          alreadyImportedCount: 1,
          failedCount: 0,
          acknowledgmentFailedCount: 0,
          failures: [],
        }}
        orderError={null}
      />,
    );

    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByText(/Demandes de soumission/)).toBeInTheDocument();
    expect(screen.getByText(/Commandes/)).toBeInTheDocument();
    expect(screen.getByText("Importation terminée")).toBeInTheDocument();
  });

  it("can be dismissed and reappears when the result changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SalesImportAlert
        requestResult={null}
        requestError={null}
        orderResult={{
          fetchedCount: 1,
          importedCount: 1,
          alreadyImportedCount: 0,
          failedCount: 0,
          acknowledgmentFailedCount: 0,
          failures: [],
        }}
        orderError={null}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Fermer le message d’importation",
      }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(
      <SalesImportAlert
        requestResult={null}
        requestError={null}
        orderResult={{
          fetchedCount: 1,
          importedCount: 0,
          alreadyImportedCount: 1,
          failedCount: 0,
          acknowledgmentFailedCount: 0,
          failures: [],
        }}
        orderError={null}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
