import { OfferResourceEditor } from "@/features/supply-offer/components/OfferResourceEditor";
import { ManualOfferDialog } from "@/features/supply-offer/components/ManualOfferDialog";
import type { SupplyOffer } from "@/features/supply-offer/types";
import { api } from "@/shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

const offer: SupplyOffer = {
  id: "offer",
  resourceId: null,
  componentName: "farine",
  label: null,
  brand: null,
  imageUrl: null,
  url: null,
  provider: null,
  price: { amount: 3, currency: "CAD" },
  packageSize: { value: 1, unit: "kg" },
  status: "AVAILABLE",
  lastSeen: null,
};
afterEach(() => vi.restoreAllMocks());
function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  );
}
function resources() {
  vi.spyOn(api, "get").mockImplementation(async (url) => ({
    data:
      url === "/resources"
        ? {
            content: [
              {
                id: "resource",
                name: "Farine de blé",
                referenceUnit: "g",
                status: "ACTIVE",
              },
            ],
          }
        : {
            id: "resource",
            name: "Farine de blé",
            referenceUnit: "g",
            status: "ACTIVE",
          },
  }));
}
it("requires an explicit resource selection and saves its UUID", async () => {
  resources();
  const put = vi.spyOn(api, "put").mockResolvedValue({ data: {} });
  const user = userEvent.setup();
  render(<OfferResourceEditor offer={offer} />, { wrapper });
  expect(screen.getByText(/À associer/)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Associer la ressource" }),
  ).toBeDisabled();
  await user.type(screen.getByRole("textbox"), "farine");
  await user.click(
    await screen.findByRole("button", { name: "Farine de blé · g" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Associer la ressource" }),
  );
  await waitFor(() =>
    expect(put).toHaveBeenCalledWith("/supply/offers/offer/resource", {
      resourceId: "resource",
    }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Association enregistrée.",
  );
});
it("shows the API validation error for incompatible units", async () => {
  resources();
  vi.spyOn(api, "put").mockRejectedValue(new Error("Unités incompatibles"));
  const user = userEvent.setup();
  render(<OfferResourceEditor offer={offer} />, { wrapper });
  await user.type(screen.getByRole("textbox"), "farine");
  await user.click(
    await screen.findByRole("button", { name: "Farine de blé · g" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Associer la ressource" }),
  );
  expect(
    await screen.findByText("Association impossible."),
  ).toBeInTheDocument();
});
it("creates a manual offer only after selecting an existing resource", async () => {
  resources();
  const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
  const close = vi.fn();
  const user = userEvent.setup();
  render(<ManualOfferDialog onClose={close} />, { wrapper });
  expect(screen.getByRole("button", { name: "Créer l’offre" })).toBeDisabled();
  await user.type(
    screen.getByRole("textbox", { name: "Rechercher une ressource existante" }),
    "farine",
  );
  await user.click(
    await screen.findByRole("button", { name: "Farine de blé · g" }),
  );
  for (const [name, value] of [
    ["Fournisseur", "Maxi"],
    ["Code fournisseur", "maxi"],
    ["Référence fournisseur", "ext"],
    ["Libellé du produit", "Farine fournisseur"],
  ]) {
    await user.type(screen.getByRole("textbox", { name }), value);
  }
  await user.type(
    screen.getByRole("spinbutton", { name: "Prix du paquet" }),
    "3.75",
  );
  await user.type(
    screen.getByRole("spinbutton", { name: "Quantité du paquet" }),
    "1000",
  );
  await user.click(screen.getByRole("button", { name: "Créer l’offre" }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(
      "/supply/offers",
      expect.objectContaining({
        resourceId: "resource",
        price: "3.75",
        packageValue: 1000,
      }),
    ),
  );
  await waitFor(() => expect(close).toHaveBeenCalled());
});
