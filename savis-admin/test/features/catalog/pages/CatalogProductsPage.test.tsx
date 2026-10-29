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
describe("Catalog product master-detail workspace", () => {
  it("shows a compact list, selects the first sorted product and preserves creation", () => {
    renderPage();
    expect(
      screen.getByRole("list", { name: "Liste des produits" }).children,
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Consulter Arche" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      detail().getByRole("heading", { name: "Arche" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ajouter un produit" }),
    ).toHaveAttribute("href", "/catalog-products/new");
    expect(screen.getAllByText(/Dès/)[0]).toHaveTextContent("4,00");
    expect(management.runAnalysis).not.toHaveBeenCalled();
  });
  it("updates the panel without leaving the list route and displays every mode", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Consulter Pâté" }));
    expect(detail().getByRole("heading", { name: "Pâté" })).toBeInTheDocument();
    expect(detail().getByText("Description de Pâté")).toBeInTheDocument();
    expect(detail().getByText("Unité")).toBeInTheDocument();
    expect(detail().getByText("Douzaine")).toBeInTheDocument();
    expect(detail().getByText(/12 unités/)).toBeInTheDocument();
    expect(detail().getByText(/40,00/)).toBeInTheDocument();
    expect(screen.getByLabelText("URL")).toHaveTextContent(
      "/catalog-products?selected=p1",
    );
  });
  it("links to the existing editor and analysis", () => {
    renderPage("/catalog-products?selected=p1");
    expect(detail().getByRole("link", { name: "Modifier" })).toHaveAttribute(
      "href",
      "/catalog-products/p1/edit?returnTo=%2Fcatalog-products%3Fselected%3Dp1",
    );
    expect(detail().getByRole("link", { name: "Analyser" })).toHaveAttribute(
      "href",
      "/catalog-products/p1/analysis?returnTo=%2Fcatalog-products%3Fselected%3Dp1",
    );
  });
  it("passes all list parameters to analysis and editing", () => {
    renderPage(
      "/catalog-products?search=Arche&category=DECORATION&publication=PUBLISHED&sort=name-desc&size=10&page=1",
    );
    for (const action of ["Analyser", "Modifier"]) {
      const href = detail()
        .getByRole("link", { name: action })
        .getAttribute("href")!;
      const returnTo = new URL(href, "http://localhost").searchParams.get(
        "returnTo",
      )!;
      const params = new URL(returnTo, "http://localhost").searchParams;
      expect(params.get("selected")).toBe("p2");
      expect(params.get("search")).toBe("Arche");
      expect(params.get("page")).toBe("1");
      expect(params.get("size")).toBe("10");
      expect(params.get("category")).toBe("DECORATION");
      expect(params.get("publication")).toBe("PUBLISHED");
      expect(params.get("sort")).toBe("name-desc");
    }
  });
  it("shows complete composition names and distinguishes base, choice and ingredient roles", () => {
    management.products = [
      {
        ...product("p1", "Pâté"),
        productBoms: [
          { id: "base", bomId: "b1", quantity: 2, displayOrder: 0 },
        ],
        choiceGroup: {
          id: "g",
          label: "Saveur",
          required: true,
          options: [
            {
              id: "o",
              code: "CHICKEN",
              name: "Poulet",
              bomId: "b2",
              active: true,
              displayOrder: 0,
            },
          ],
        },
        ingredientOptions: [
          {
            id: "i",
            code: "EXTRA",
            name: "Extra",
            bomId: "b3",
            defaultQuantity: 1,
            minQuantity: 0,
            maxQuantity: 3,
            extraPrice: { amount: 1, currency: "CAD" },
            active: false,
            displayOrder: 0,
          },
        ],
      },
    ];
    management.boms = ["b1", "b2", "b3"].map((id) => ({
      id,
      name: `Nom complet de la composition ${id}`,
      type: "FOOD",
      description: "",
      imageUrl: "",
      instructions: "",
      components: [],
      activities: [],
      yield: { quantity: 12, unit: "UNIT" },
    }));
    renderPage();
    expect(
      detail().getByRole("link", { name: "Nom complet de la composition b1" }),
    ).toHaveAttribute("href", "/boms/b1");
    expect(detail().getByText("Base commune")).toBeInTheDocument();
    expect(detail().getByText("Quantité : 2")).toBeInTheDocument();
    expect(detail().getByText(/Saveur · Poulet/)).toBeInTheDocument();
    expect(detail().getByText("Ingrédient")).toBeInTheDocument();
    expect(detail().getByText("Extra")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Consulter Pâté" }),
    ).toHaveTextContent("3 composition(s)");
  });
  it("handles products without compositions or sale modes", () => {
    management.products = [{ ...product("p1", "Pâté"), purchaseModes: [] }];
    renderPage();
    expect(
      detail().getByText("Aucune composition associée"),
    ).toBeInTheDocument();
    expect(detail().getByText("Aucun mode de vente")).toBeInTheDocument();
    expect(screen.getByText("Prix non renseigné")).toBeInTheDocument();
  });
  it("searches names, codes and descriptions ignoring accents", () => {
    renderPage();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Rechercher un produit" }),
      { target: { value: "pate" } },
    );
    expect(
      screen.getByRole("button", { name: "Consulter Pâté" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Consulter Arche" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("URL")).toHaveTextContent("search=pate");
  });
  it("filters category, publication and availability and sorts from URL state", () => {
    renderPage(
      "/catalog-products?category=DECORATION&publication=PUBLISHED&availability=AVAILABLE&sort=name-desc",
    );
    expect(
      screen.getByRole("button", { name: "Consulter Arche" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Consulter Pâté" }),
    ).not.toBeInTheDocument();
  });
  it("changes filters using accessible controls", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("combobox", { name: "Publication" }));
    await user.click(screen.getByRole("option", { name: "Brouillons" }));
    expect(
      screen.getByRole("button", { name: "Consulter Pâté" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Consulter Arche" }),
    ).not.toBeInTheDocument();
  });
  it("keeps filters and pagination when selecting and retains selection on refresh", () => {
    management.products = Array.from({ length: 25 }, (_, i) =>
      product(`p${i}`, `Produit ${String(i).padStart(2, "0")}`),
    );
    const view = renderPage(
      "/catalog-products?search=Produit&size=10&page=2&sort=name-asc",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Consulter Produit 12" }),
    );
    view.refresh();
    expect(
      detail().getByRole("heading", { name: "Produit 12" }),
    ).toBeInTheDocument();
    const url = screen.getByLabelText("URL").textContent!;
    expect(url).toContain("page=2");
    expect(url).toContain("search=Produit");
    expect(url).toContain("selected=p12");
  });
  it("keeps a selected product when refreshed data moves it onto another page", () => {
    management.products = Array.from({ length: 11 }, (_, i) =>
      product(`p${i}`, `Produit ${String(i).padStart(2, "0")}`),
    );
    const view = renderPage("/catalog-products?size=10&page=1&selected=p9");
    management.products = [
      product("new", "Avant les autres"),
      ...management.products,
    ];
    view.refresh();
    expect(
      detail().getByRole("heading", { name: "Produit 09" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 2 sur 2")).toBeInTheDocument();
  });
  it("changes pages and clears a selection that is no longer on the current page", () => {
    management.products = Array.from({ length: 11 }, (_, i) =>
      product(`p${i}`, `Produit ${String(i).padStart(2, "0")}`),
    );
    renderPage("/catalog-products?size=10&selected=p1");
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(
      detail().getByRole("heading", { name: "Produit 10" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 2 sur 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Précédent" }));
    expect(
      detail().getByRole("heading", { name: "Produit 00" }),
    ).toBeInTheDocument();
  });
  it("falls back to another product after deletion and clamps an empty last page", () => {
    management.products = Array.from({ length: 11 }, (_, i) =>
      product(`p${i}`, `Produit ${String(i).padStart(2, "0")}`),
    );
    const view = renderPage("/catalog-products?size=10&page=2&selected=p10");
    expect(
      detail().getByRole("heading", { name: "Produit 10" }),
    ).toBeInTheDocument();
    management.products = management.products.slice(0, 10);
    view.refresh();
    expect(
      detail().getByRole("heading", { name: "Produit 00" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 1 sur 1")).toBeInTheDocument();
  });
  it("preserves publish and republish actions and busy state", () => {
    const view = renderPage();
    fireEvent.click(detail().getByRole("button", { name: "Republier" }));
    expect(management.publishProduct).toHaveBeenCalledWith(
      management.products[1],
    );
    fireEvent.click(screen.getByRole("button", { name: "Consulter Pâté" }));
    fireEvent.click(detail().getByRole("button", { name: "Publier" }));
    expect(management.publishProduct).toHaveBeenCalledWith(
      management.products[0],
    );
    management.isPublishing = true;
    view.refresh();
    expect(detail().getByRole("button", { name: "Publier" })).toBeDisabled();
  });
  it("preserves unpublication and confirmed deletion", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(detail().getByRole("button", { name: "Actions" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Retirer de SavouretPlus" }),
    );
    expect(management.unpublishProduct).toHaveBeenCalledWith(
      management.products[1],
    );
    await user.click(detail().getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Supprimer" }));
    expect(management.deleteProduct).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Oui" }));
    expect(management.deleteProduct).toHaveBeenCalledWith("p2");
  });
  it("uses the mobile list-detail convention with a clear return action", () => {
    renderPage();
    const list = screen.getByRole("list", {
      name: "Liste des produits",
    }).parentElement!;
    fireEvent.click(screen.getByRole("button", { name: "Consulter Pâté" }));
    expect(list).toHaveClass("hidden", "lg:block");
    expect(
      screen.getByRole("region", { name: "Détail du produit" }).parentElement,
    ).toHaveClass("fixed", "lg:sticky");
    fireEvent.click(screen.getByRole("button", { name: "Retour à la liste" }));
    expect(list).not.toHaveClass("hidden");
    expect(
      screen.getByRole("button", { name: "Consulter Pâté" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("shows empty list and panel states", () => {
    management.products = [];
    renderPage();
    expect(
      screen.getByText("Aucun produit dans le catalogue."),
    ).toBeInTheDocument();
    expect(screen.getByText("Aucun produit à consulter.")).toBeInTheDocument();
  });
  it("shows no search results", () => {
    renderPage("/catalog-products?search=inexistant");
    expect(
      screen.getByText("Aucun produit ne correspond aux filtres sélectionnés."),
    ).toBeInTheDocument();
    expect(screen.getByText("Aucun produit à consulter.")).toBeInTheDocument();
  });
  it("shows loading", () => {
    management.isLoading = true;
    renderPage();
    expect(screen.getByText("Chargement des produits…")).toHaveTextContent(
      "Chargement des produits",
    );
  });
  it("shows errors", () => {
    management.isError = true;
    management.error = new Error("Service indisponible");
    renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Impossible de charger les produits.",
    );
  });
});
