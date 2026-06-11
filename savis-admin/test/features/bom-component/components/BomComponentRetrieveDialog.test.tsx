import { BomComponentRetrieveDialog } from "@/features/bom-component/components/BomComponentRetrieveDialog";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("BomComponentRetrieveDialog", () => {
  it("retrieves a BOM component and closes after success", async () => {
    const user = userEvent.setup();
    const onRetrieve = vi.fn().mockResolvedValue(true);

    render(
      <BomComponentRetrieveDialog
        isRetrieving={false}
        onRetrieve={onRetrieve}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Récupérer un composant BOM" }),
    );
    await user.type(screen.getByLabelText("Nom du composant BOM"), "farine");
    await user.type(
      screen.getByLabelText("URL de l'offre"),
      "https://www.maxi.ca/farine/p/12345",
    );
    await user.click(screen.getByRole("button", { name: "Récupérer" }));

    expect(onRetrieve).toHaveBeenCalledWith({
      searchTerm: "farine",
      type: "FOOD",
      provider: "Maxi",
      url: "https://www.maxi.ca/farine/p/12345",
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", {
          name: "Récupérer un composant BOM",
        }),
      ).not.toBeInTheDocument();
    });
  });

  it("keeps the dialog open when retrieval fails", async () => {
    const user = userEvent.setup();
    const onRetrieve = vi.fn().mockResolvedValue(false);

    render(
      <BomComponentRetrieveDialog
        isRetrieving={false}
        onRetrieve={onRetrieve}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Récupérer un composant BOM" }),
    );
    await user.type(screen.getByLabelText("Nom du composant BOM"), "farine");
    await user.type(
      screen.getByLabelText("URL de l'offre"),
      "https://www.maxi.ca/farine/p/12345",
    );
    await user.click(screen.getByRole("button", { name: "Récupérer" }));

    expect(
      screen.getByRole("dialog", { name: "Récupérer un composant BOM" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nom du composant BOM")).toHaveValue("farine");
    expect(screen.getByLabelText("URL de l'offre")).toHaveValue(
      "https://www.maxi.ca/farine/p/12345",
    );
  });

  it("requires both a component name and an offer URL", async () => {
    const user = userEvent.setup();
    const onRetrieve = vi.fn();

    render(
      <BomComponentRetrieveDialog
        isRetrieving={false}
        onRetrieve={onRetrieve}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Récupérer un composant BOM" }),
    );

    expect(screen.getByRole("button", { name: "Récupérer" })).toBeDisabled();
    await user.type(screen.getByLabelText("Nom du composant BOM"), "farine");
    expect(screen.getByRole("button", { name: "Récupérer" })).toBeDisabled();
    await user.type(
      screen.getByLabelText("URL de l'offre"),
      "https://www.maxi.ca/farine/p/12345",
    );
    expect(screen.getByRole("button", { name: "Récupérer" })).toBeEnabled();
  });
});
