import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogProductDetails } from "@/features/catalog/components/CatalogProductDetails";
import {
  emptyCatalogProduct,
  emptyIngredientOption,
  emptyPurchaseMode,
  type CatalogProduct,
} from "@/features/catalog/types";

function renderPanel(product: CatalogProduct) {
  return render(
    <MemoryRouter>
      <CatalogProductDetails
        product={product}
        boms={[]}
        publishing={false}
        onPublish={vi.fn()}
        onUnpublish={vi.fn()}
        onDelete={vi.fn()}
      />
    </MemoryRouter>,
  );
}
const product = (): CatalogProduct => ({
  ...emptyCatalogProduct(),
  id: "p1",
  name: "Pâté kòde",
  imageUrl: "https://example.com/pate.jpg",
  purchaseModes: [
    {
      ...emptyPurchaseMode(),
      code: "UNIT",
      label: "Unité",
      quantity: 1,
      price: { amount: 4, currency: "CAD" },
    },
    {
      ...emptyPurchaseMode(),
      code: "DOZEN",
      label: "Douzaine",
      quantity: 12,
      price: { amount: 40, currency: "CAD" },
      active: false,
    },
  ],
  ingredientOptions: [
    {
      ...emptyIngredientOption(),
      code: "EGG",
      name: "Œuf bouilli extra",
      defaultQuantity: 1,
      minQuantity: 0,
      maxQuantity: 3,
      extraPrice: { amount: 1.5, currency: "CAD" },
    },
  ],
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("Compact product detail panel", () => {
  it("keeps product identity in the scrollable content and actions outside", () => {
    renderPanel(product());
    const panel = screen.getByRole("region", { name: "Détail du produit" });
    const content = screen.getByRole("region", {
      name: "Informations du produit",
    });
    const footer = screen.getByLabelText("Actions du produit");
    expect(content).toHaveClass(
      "overflow-y-auto",
      "min-h-0",
      "overscroll-contain",
    );
    expect(content).toHaveAttribute("tabindex", "0");
    expect(content).not.toContainElement(footer);
    expect(content).toContainElement(
      screen.getByRole("heading", { name: "Pâté kòde" }),
    );
    expect(panel).toContainElement(footer);
    expect(footer).toHaveClass(
      "shrink-0",
      "bg-card",
      "border-t",
      "justify-end",
    );
    expect(within(footer).getByRole("button", { name: "Actions" })).toHaveClass(
      "size-7",
    );
    expect(
      within(footer).getByRole("link", { name: "Analyser" }),
    ).toBeInTheDocument();
  });
  it("fits the actual viewport space and recalculates after resize and scroll", () => {
    vi.stubGlobal("innerHeight", 800);
    let top = 300;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({
        top,
        bottom: top,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }),
    );
    const view = renderPanel(product());
    const panel = screen.getByRole("region", { name: "Détail du produit" });
    expect(panel.style.getPropertyValue("--catalog-detail-height")).toBe(
      "488px",
    );
    top = 100;
    fireEvent.scroll(window);
    expect(panel.style.getPropertyValue("--catalog-detail-height")).toBe(
      "688px",
    );
    vi.stubGlobal("innerHeight", 600);
    fireEvent.resize(window);
    expect(panel.style.getPropertyValue("--catalog-detail-height")).toBe(
      "488px",
    );
    top = 700;
    fireEvent.resize(window);
    expect(panel.style.getPropertyValue("--catalog-detail-height")).toBe("0px");
    view.unmount();
    fireEvent.resize(window);
  });
  it("presents ingredient quantities and a signed supplement without losing the configured name", () => {
    renderPanel(product());
    const compositions = screen.getByRole("region", {
      name: /^Compositions/,
    });
    expect(
      within(compositions).getByRole("heading", {
        name: "Ingrédients personnalisables (1)",
      }),
    ).toBeInTheDocument();
    expect(
      within(compositions).getByText("Œuf bouilli extra"),
    ).toBeInTheDocument();
    expect(
      within(compositions).getByText("Par défaut : 1 · min. 0 / max. 3"),
    ).toBeInTheDocument();
    expect(within(compositions).getByText(/\+1,50/)).toBeInTheDocument();
    expect(
      within(compositions).getByText("Aucune composition renseignée"),
    ).toBeInTheDocument();
  });
  it("keeps all modes and their quantity, allocation and aligned prices", () => {
    renderPanel(product());
    const modes = within(
      screen.getByRole("region", { name: "Modes de vente" }),
    );
    expect(modes.getByText("Douzaine")).toBeInTheDocument();
    expect(modes.getByText(/12 unités · sans choix/)).toBeInTheDocument();
    expect(modes.getByText("Inactif")).toBeInTheDocument();
    expect(modes.getByText(/40,00/)).toHaveClass("text-right", "tabular-nums");
  });
  it("shows full descriptions without expansion and contains the header image", () => {
    const description = "Description très longue. ".repeat(100);
    renderPanel({ ...product(), description });
    expect(screen.getByText(description.trim())).toHaveClass(
      "whitespace-pre-wrap",
      "[overflow-wrap:anywhere]",
    );
    expect(screen.getByText(description.trim())).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Description et informations complémentaires",
      }),
    ).toBeVisible();
    expect(screen.getByRole("img", { name: "Pâté kòde" })).toHaveClass(
      "size-[300px]",
      "object-contain",
    );
    fireEvent.error(screen.getByRole("img", { name: "Pâté kòde" }));
    expect(
      screen.getByRole("img", { name: "Aucune image pour Pâté kòde" }),
    ).toBeInTheDocument();
  });
  it("handles absent images, descriptions and compositions", () => {
    renderPanel({
      ...product(),
      imageUrl: "",
      description: " ",
      ingredientOptions: [],
    });
    expect(screen.getByText("Aucune description")).toBeVisible();
    expect(screen.getByText("Aucune composition associée")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Aucune image pour Pâté kòde" }),
    ).toBeInTheDocument();
  });
});
