import { CatalogProductEditor } from "@/features/catalog/components/CatalogProductEditor";
import {
  emptyCatalogProduct,
  type CatalogProduct,
} from "@/features/catalog/types";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const product: CatalogProduct = {
  ...emptyCatalogProduct("TASTING"),
  id: "product-1",
  code: "PROD-1",
  slug: "produit-1",
  name: "Produit test",
  description: "Description",
  imageUrl: "https://example.com/product.jpg",
  availabilityNote: "Sur commande",
  productType: "SINGLE_CHOICE",
  purchaseModes: [
    {
      ...emptyCatalogProduct().purchaseModes[0],
      code: "unit",
      label: "Unité",
      price: { amount: 10, currency: "CAD" },
    },
  ],
};

describe("CatalogProductEditor", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("renders a full-page form with responsive section navigation", async () => {
    const user = userEvent.setup();
    renderEditor();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Modifier le produit" }),
    ).toBeInTheDocument();

    const navigation = screen.getByRole("navigation", {
      name: "Sections du produit",
    });
    expect(screen.getByText("Dans cette page")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Informations générales",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nom, identifiants, description et images présentés dans le catalogue.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Compositions de base",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Composition toujours incluse dans le coût, peu importe le choix du client.",
      ),
    ).toBeInTheDocument();
    const informationLink = within(navigation).getByRole("link", {
      name: "Informations générales",
    });
    expect(informationLink).toHaveAttribute("href", "#product-information");
    expect(informationLink).toHaveAttribute("aria-current", "location");
    expect(
      within(navigation).getByRole("link", { name: "Modes d'achat" }),
    ).toHaveAttribute("href", "#product-purchase-modes");
    const optionsLink = within(navigation).getByRole("link", {
      name: "Options et Choix",
    });
    expect(optionsLink).toHaveAttribute("href", "#product-options");
    await user.click(optionsLink);
    expect(optionsLink).toHaveAttribute("aria-current", "location");
    expect(informationLink).not.toHaveAttribute("aria-current");
    expect(screen.queryByText(/\bBOMs?\b/i)).not.toBeInTheDocument();

    const helpButton = screen.getByRole("button", {
      name: "Aide contextuelle — Options et Choix",
    });
    expect(helpButton.closest("aside")).not.toBeNull();
    await user.click(helpButton);
    const contextualHelp = screen.getByRole("dialog", {
      name: "Aide — Options et Choix",
    });
    expect(
      within(contextualHelp).getByText("Configuration actuelle"),
    ).toBeInTheDocument();
    expect(
      within(contextualHelp).getByText("Choix unique"),
    ).toBeInTheDocument();
    await user.click(
      within(contextualHelp).getByRole("button", { name: "Close" }),
    );

    expect(
      screen.getByRole("button", { name: "Enregistrer" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Annuler" })).toBeInTheDocument();
  });

  it("warns before abandoning an edited product", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onDirtyChange = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderEditor({ onCancel, onDirtyChange });

    const name = screen.getByDisplayValue("Produit test");
    await user.clear(name);
    await user.type(name, "Produit modifié");
    expect(screen.getByDisplayValue("PROD-1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("produit-1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(onDirtyChange).toHaveBeenCalledWith(true);
    expect(window.confirm).toHaveBeenCalledWith(
      "Abandonner les modifications non enregistrées ?",
    );
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("generates code and slug from the name until they are customized", () => {
    renderEditor({ product: undefined });

    const [name, code, slug] = screen.getAllByRole("textbox");
    fireEvent.change(name, { target: { value: "Pâté déjeuner & café" } });

    expect(code).toHaveValue("pate-dejeuner-cafe");
    expect(slug).toHaveValue("pate-dejeuner-cafe");

    fireEvent.change(code, { target: { value: "code-personnalise" } });
    fireEvent.change(name, {
      target: { value: "Pâté déjeuner & café familial" },
    });

    expect(code).toHaveValue("code-personnalise");
    expect(slug).toHaveValue("pate-dejeuner-cafe-familial");
  });

  it("offers to keep a new product draft before leaving", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderEditor({ product: undefined, onCancel });

    await user.type(screen.getAllByRole("textbox")[0], "Nouveau produit");
    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(
      screen.getByRole("heading", {
        name: "Il y a un brouillon non enregistré",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Garder" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(localStorage.getItem("catalog-product-draft")).toContain(
      "Nouveau produit",
    );
  });
});

function renderEditor(
  overrides: Partial<React.ComponentProps<typeof CatalogProductEditor>> = {},
) {
  render(
    <CatalogProductEditor
      product={product}
      boms={[]}
      saving={false}
      onSave={vi.fn()}
      onCancel={vi.fn()}
      onSaved={vi.fn()}
      onDirtyChange={vi.fn()}
      {...overrides}
    />,
  );
}
