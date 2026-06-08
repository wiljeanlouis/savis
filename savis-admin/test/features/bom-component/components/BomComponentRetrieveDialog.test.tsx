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
    await user.click(screen.getByRole("button", { name: "Récupérer" }));

    expect(onRetrieve).toHaveBeenCalledWith("farine", "FOOD");
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
    await user.click(screen.getByRole("button", { name: "Récupérer" }));

    expect(
      screen.getByRole("dialog", { name: "Récupérer un composant BOM" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nom du composant BOM")).toHaveValue("farine");
  });
});
