import { BomComponentRetrieveDialog } from "@/features/bom-component/components/BomComponentRetrieveDialog";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("BomComponentRetrieveDialog", () => {
  it("retrieves a BOM component and closes after success", async () => {
    const onRetrieve = vi.fn().mockResolvedValue(true);

    render(
      <BomComponentRetrieveDialog
        isRetrieving={false}
        onRetrieve={onRetrieve}
      />,
    );

    fireEvent.click(
      screen.getByText("Récupérer un composant BOM", { selector: "button" }),
    );
    fireEvent.change(screen.getByLabelText("Nom du composant BOM"), {
      target: { value: "farine" },
    });
    fireEvent.change(screen.getByLabelText("URL de l'offre"), {
      target: { value: "https://www.maxi.ca/farine/p/12345" },
    });
    const dialog = document.querySelector('[role="dialog"]');
    fireEvent.submit(
      screen.getByLabelText("Nom du composant BOM").closest("form")!,
    );

    await waitFor(() => {
      expect(onRetrieve).toHaveBeenCalledWith({
        searchTerm: "farine",
        type: "FOOD",
        provider: "Maxi",
        url: "https://www.maxi.ca/farine/p/12345",
      });
    });
    await waitFor(() => {
      expect(dialog).toHaveAttribute("data-state", "closed");
    });
  }, 15_000);

  it("keeps the dialog open when retrieval fails", async () => {
    const onRetrieve = vi.fn().mockResolvedValue(false);

    render(
      <BomComponentRetrieveDialog
        isRetrieving={false}
        onRetrieve={onRetrieve}
      />,
    );

    fireEvent.click(
      screen.getByText("Récupérer un composant BOM", { selector: "button" }),
    );
    fireEvent.change(screen.getByLabelText("Nom du composant BOM"), {
      target: { value: "farine" },
    });
    fireEvent.change(screen.getByLabelText("URL de l'offre"), {
      target: { value: "https://www.maxi.ca/farine/p/12345" },
    });
    fireEvent.submit(
      screen.getByLabelText("Nom du composant BOM").closest("form")!,
    );

    await waitFor(() => {
      expect(onRetrieve).toHaveBeenCalledOnce();
    });
    expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
    expect(screen.getByLabelText("Nom du composant BOM")).toHaveValue("farine");
    expect(screen.getByLabelText("URL de l'offre")).toHaveValue(
      "https://www.maxi.ca/farine/p/12345",
    );
  });

  it("requires both a component name and an offer URL", () => {
    const onRetrieve = vi.fn();

    render(
      <BomComponentRetrieveDialog
        isRetrieving={false}
        onRetrieve={onRetrieve}
      />,
    );

    fireEvent.click(
      screen.getByText("Récupérer un composant BOM", { selector: "button" }),
    );

    const submitButton = screen.getByText("Récupérer", { selector: "button" });
    expect(submitButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nom du composant BOM"), {
      target: { value: "farine" },
    });
    expect(submitButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText("URL de l'offre"), {
      target: { value: "https://www.maxi.ca/farine/p/12345" },
    });
    expect(submitButton).toBeEnabled();
  });
});
