import { useCatalogProductManagement } from "@/features/catalog/hooks/useCatalogProductManagement";
import { CatalogProductsPage } from "@/features/catalog/pages/CatalogProductsPage";
import {
  emptyCatalogProduct,
  emptyPurchaseMode,
  type CatalogProduct,
} from "@/features/catalog/types";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/catalog/hooks/useCatalogProductManagement", () => ({
  useCatalogProductManagement: vi.fn(),
}));
beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
});
const product = (
  id: string,
  name: string,
  published = false,
): CatalogProduct => ({
  ...emptyCatalogProduct(),
  id,
  name,
  code: id,
  description: `Description de ${name}`,
  published,
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
    },
  ],
});
let management: ReturnType<typeof useCatalogProductManagement>;
function Location() {
  const location = useLocation();
  return (
    <output aria-label="URL">
      {location.pathname}
      {location.search}
    </output>
  );
}
function renderPage(url = "/catalog-products") {
  const tree = () => (
    <MemoryRouter initialEntries={[url]}>
      <CatalogProductsPage />
      <Location />
    </MemoryRouter>
  );
  const view = render(tree());
  return { ...view, refresh: () => view.rerender(tree()) };
}
const detail = () =>
  within(screen.getByRole("region", { name: "Détail du produit" }));
beforeEach(() => {
  management = {
    products: [
      product("p1", "Pâté"),
      { ...product("p2", "Arche", true), category: "DECORATION" },
    ],
    boms: [],
    analysis: {},
    isLoading: false,
    isError: false,
    error: null,
    isSaving: false,
    isPublishing: false,
    saveProduct: vi.fn(),
    deleteProduct: vi.fn(),
    publishProduct: vi.fn(),
    unpublishProduct: vi.fn(),
    runAnalysis: vi.fn(),
  };
  vi.mocked(useCatalogProductManagement).mockImplementation(() => management);
});
describe("Catalog product table and drawer", () => {
  it("shows all columns and opens no detail or calculation initially", () => {
    renderPage();
    expect(
      screen.getByRole("table", { name: "Liste des produits" }),
    ).toBeVisible();
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Nouveau produit" }),
    ).toHaveAttribute("href", "/catalog-products/new");
    expect(management.runAnalysis).not.toHaveBeenCalled();
  });
  it("opens via keyboard, shows modes and closes with Escape, preserving URL and focus", async () => {
    const user = userEvent.setup();
    renderPage("/catalog-products?custom=keep&size=10");
    const trigger = screen.getByRole("button", { name: "Détails de Pâté" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("dialog", { name: "Détail du produit" }),
    ).toBeVisible();
    expect(detail().getByText("Unité")).toBeVisible();
    expect(detail().getByText("Douzaine")).toBeVisible();
    expect(detail().getByText(/40,00/)).toBeVisible();
    expect(screen.getByLabelText("URL")).toHaveTextContent("selected=p1");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByLabelText("URL")).toHaveTextContent(
      "custom=keep&size=10",
    );
    expect(screen.getByLabelText("URL")).not.toHaveTextContent("selected=");
    expect(trigger).toHaveFocus();
  });
  it("restores a selected drawer and carries list context to editing and analysis", () => {
    renderPage(
      "/catalog-products?selected=p1&search=pate&size=10&sort=name-desc",
    );
    for (const action of ["Modifier", "Analyser"]) {
      const href = detail()
        .getByRole("link", { name: action })
        .getAttribute("href")!;
      const returnTo = new URL(href, "http://localhost").searchParams.get(
        "returnTo",
      )!;
      expect(returnTo).toContain("selected=p1");
      expect(returnTo).toContain("search=pate");
      expect(returnTo).toContain("sort=name-desc");
    }
  });
  it("searches without accents, filters publication and resets", async () => {
    const user = userEvent.setup();
    renderPage();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Rechercher un produit" }),
      { target: { value: "pate" } },
    );
    expect(
      screen.getByRole("button", { name: "Détails de Pâté" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Détails de Arche" }),
    ).toBeNull();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Rechercher un produit" }),
      { target: { value: "" } },
    );
    await user.click(screen.getByRole("button", { name: "Filtres" }));
    await user.click(screen.getByRole("combobox", { name: "Publication" }));
    await user.click(screen.getByRole("option", { name: "Publiés" }));
    expect(
      screen.queryByRole("button", { name: "Détails de Pâté" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Détails de Arche" }),
    ).toBeVisible();
  });
  it("sorts the complete dataset before pagination in both directions", async () => {
    management.products = Array.from({ length: 25 }, (_, i) => ({
      ...product(`p${i}`, `Produit ${String(i).padStart(2, "0")}`),
      purchaseModes: [
        {
          ...emptyPurchaseMode(),
          active: true,
          price: { amount: i, currency: "CAD" },
        },
      ],
    }));
    renderPage("/catalog-products?size=10&custom=keep");
    await userEvent.click(
      screen.getByRole("button", { name: /Prix à partir de/ }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Prix à partir de/ }),
    );
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Produit 24");
    expect(rows).toHaveLength(11);
    expect(
      screen.getByRole("columnheader", { name: /Prix à partir de/ }),
    ).toHaveAttribute("aria-sort", "descending");
    await userEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Produit 14");
    expect(screen.getByLabelText("URL")).toHaveTextContent("custom=keep");
  });
  it("retains base, choice and ingredient groups with quantities and links", () => {
    management.products[0].productBoms = [
      { id: "base", bomId: "b1", quantity: 2, displayOrder: 0 },
    ];
    management.products[0].choiceGroup = {
      id: "g",
      label: "Saveur",
      required: true,
      options: [
        {
          id: "o",
          code: "A",
          name: "Poulet",
          bomId: "b2",
          active: true,
          displayOrder: 0,
        },
      ],
    };
    management.products[0].ingredientOptions = [
      {
        id: "i",
        code: "EXTRA",
        name: "Extra",
        bomId: "b3",
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 3,
        extraPrice: { amount: 1, currency: "CAD" },
        active: true,
        displayOrder: 0,
      },
    ];
    management.boms = ["b1", "b2", "b3"].map((id) => ({
      id,
      name: `Composition ${id}`,
      type: "FOOD",
      description: "",
      imageUrl: "",
      instructions: "",
      components: [],
      activities: [],
      yield: { quantity: 12, unit: "UNIT" },
    }));
    renderPage("/catalog-products?selected=p1");
    for (const name of [
      "Compositions de base (1)",
      "Choix (1)",
      "Ingrédients personnalisables (1)",
    ])
      expect(detail().getByRole("heading", { name })).toBeVisible();
    expect(detail().getByText("Quantité : 2")).toBeVisible();
    expect(
      detail().getByRole("link", { name: "Composition b1" }),
    ).toHaveAttribute("href", "/boms/b1");
  });
  it("preserves publication, republication, withdrawal and confirmed deletion", async () => {
    renderPage("/catalog-products?selected=p2");
    await userEvent.click(detail().getByRole("button", { name: "Republier" }));
    expect(management.publishProduct).toHaveBeenCalledWith(
      management.products[1],
    );
    await userEvent.click(detail().getByRole("button", { name: "Actions" }));
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Retirer de SavouretPlus" }),
    );
    expect(management.unpublishProduct).toHaveBeenCalledWith(
      management.products[1],
    );
    await userEvent.click(detail().getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Supprimer" }));
    expect(management.deleteProduct).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Oui" }));
    expect(management.deleteProduct).toHaveBeenCalledWith("p2");
  });
  it("publishes a draft and exposes its busy state", () => {
    management.isPublishing = true;
    renderPage("/catalog-products?selected=p1");
    expect(detail().getByRole("button", { name: "Publier" })).toBeDisabled();
  });
  it("shows empty, loading and failed list states", () => {
    management.products = [];
    const view = renderPage();
    expect(screen.getByText("Aucun produit dans le catalogue.")).toBeVisible();
    management.isLoading = true;
    view.refresh();
    expect(screen.getByText("Chargement des produits…")).toBeVisible();
    management.isLoading = false;
    management.isError = true;
    view.refresh();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Impossible de charger les produits.",
    );
  });
  it("keeps filters in a counted popover, clears only filters and restores focus on Escape", async () => {
    renderPage(
      "/catalog-products?search=Arche&category=DECORATION&publication=PUBLISHED&availability=UNAVAILABLE&sort=name-desc&size=10&custom=keep",
    );
    const trigger = screen.getByRole("button", { name: "Filtres · 2" });
    expect(screen.queryByRole("combobox", { name: "Catégorie" })).toBeNull();
    await userEvent.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "Filtres des produits" }),
    ).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Catégorie" })).toBeVisible();
    expect(
      screen.queryByRole("combobox", { name: "Disponibilité" }),
    ).toBeNull();
    expect(screen.getByLabelText("URL")).not.toHaveTextContent("availability=");
    await userEvent.click(
      screen.getByRole("button", { name: "Effacer les filtres" }),
    );
    expect(
      screen.getByRole("button", { name: "Effacer les filtres" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Filtres" })).toBeVisible();
    const url = screen.getByLabelText("URL");
    for (const param of [
      "search=Arche",
      "sort=name-desc",
      "size=10",
      "custom=keep",
    ])
      expect(url).toHaveTextContent(param);
    expect(url).not.toHaveTextContent("category=");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    await userEvent.click(
      screen.getByRole("textbox", { name: "Rechercher un produit" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Rechercher" }));
    expect(
      screen.getByRole("textbox", { name: "Rechercher un produit" }),
    ).toHaveFocus();
  });
});
