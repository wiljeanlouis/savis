import { SupplyOfferDetailsDialog } from "@/features/supply-offer/components/SupplyOfferDetailsDialog";
import { SupplyOffersTable } from "@/features/supply-offer/components/SupplyOffersTable";
import type { SupplyOffer } from "@/features/supply-offer/types";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

const offer: SupplyOffer = {
  id: "offer-123",
  componentName: "Farine",
  label: "Farine tout usage",
  brand: "Sans nom",
  imageUrl: "https://images.example/farine.jpg",
  url: "https://shop.example/farine",
  provider: {
    name: "Épicerie Exemple",
    identifier: "provider-1",
    site: "https://shop.example",
  },
  price: { amount: 3.75, currency: "CAD" },
  packageSize: { value: 1, unit: "kg" },
  status: "AVAILABLE",
  lastSeen: "2026-10-14T12:00:00",
};

describe("SupplyOffersTable", () => {
  it("shows nullable values safely and provides a failed-image placeholder", () => {
    const nullableOffer: SupplyOffer = {
      ...offer,
      id: "offer-nullable",
      label: null,
      brand: null,
      imageUrl: null,
      url: null,
      provider: null,
      price: null,
      packageSize: null,
      lastSeen: null,
      status: "UNAVAILABLE",
    };

    render(
      <SupplyOffersTable offers={[nullableOffer]} onViewDetails={vi.fn()} />,
    );

    expect(screen.getByText("Marque non renseignée")).toBeInTheDocument();
    expect(screen.getByText("Indisponible")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Image indisponible pour Farine" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /ouvrir/i }),
    ).not.toBeInTheDocument();
  });

  it("opens secure supplier links and displays read-only details", async () => {
    const user = userEvent.setup();

    function TestView() {
      const [selected, setSelected] = useState<SupplyOffer | null>(null);
      return (
        <>
          <SupplyOffersTable offers={[offer]} onViewDetails={setSelected} />
          <SupplyOfferDetailsDialog
            offer={selected}
            onClose={() => setSelected(null)}
          />
        </>
      );
    }

    render(<TestView />);

    const productLink = screen.getByRole("link", {
      name: "Ouvrir Farine tout usage chez le fournisseur",
    });
    expect(productLink).toHaveAttribute("target", "_blank");
    expect(productLink).toHaveAttribute("rel", "noopener noreferrer");

    const image = screen.getByRole("img", { name: "Farine tout usage" });
    fireEvent.error(image);
    expect(
      screen.getByRole("img", {
        name: "Image indisponible pour Farine tout usage",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Afficher les détails de Farine tout usage",
      }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("offer-123")).toBeInTheDocument();
    expect(screen.getByText("provider-1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voir le produit" }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.queryByRole("button", {
        name: /modifier|supprimer|valider|rejeter/i,
      }),
    ).not.toBeInTheDocument();
  });
});
