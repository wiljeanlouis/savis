import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { ListLoading } from "@/shared/components/ListLoading";
import { NoData } from "@/shared/components/NoData";

describe("États des listes", () => {
  it("annonce le chargement pendant l’affichage des skeletons", () => {
    render(<ListLoading message="Chargement des produits…" />);
    expect(
      screen.getByRole("status", { name: "Chargement des produits…" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Aucune donnée trouvée."),
    ).not.toBeInTheDocument();
  });

  it("affiche le message vide et permet de réinitialiser les filtres", () => {
    const reset = vi.fn();
    render(
      <NoData
        description="Modifiez les filtres."
        action={<button onClick={reset}>Réinitialiser</button>}
      >
        Aucun produit trouvé.
      </NoData>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Aucun produit trouvé.",
    );
    expect(screen.getByText("Modifiez les filtres.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
