import { CatalogProductCard } from "@/features/catalog/components/CatalogProductCard";
import { emptyCatalogProduct } from "@/features/catalog/types";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

const product = {
  ...emptyCatalogProduct("TASTING"),
  id: "product-1",
  code: "PROD-1",
  slug: "produit-1",
  name: "Produit test",
  description: "Une description claire et visible du produit.",
  imageUrl: "https://example.com/product.jpg",
};

describe("CatalogProductCard", () => {
  it("keeps the main product actions directly available on the card", () => {
    render(
      <MemoryRouter>
        <CatalogProductCard
          product={product}
          boms={[]}
          publishing={false}
          onAnalyze={vi.fn()}
          onPublish={vi.fn()}
          onUnpublish={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
      "href",
      "/catalog-products/product-1/edit",
    );
    expect(
      screen.getByRole("button", { name: "Analyser" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions" })).toBeInTheDocument();
    expect(
      screen.getByText("Une description claire et visible du produit."),
    ).toHaveClass("text-xs/relaxed");
    expect(
      screen.getByRole("img", { name: "Image de Produit test" }),
    ).toHaveClass("size-20", "sm:size-28");
    expect(screen.getByRole("group", { name: "Prix principal" })).toHaveClass(
      "col-start-3",
      "row-start-1",
    );
  });

  it("shows a discreet fallback when the description is empty", () => {
    render(
      <MemoryRouter>
        <CatalogProductCard
          product={{ ...product, description: " " }}
          boms={[]}
          publishing={false}
          onAnalyze={vi.fn()}
          onPublish={vi.fn()}
          onUnpublish={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Aucune description")).toHaveClass("italic");
  });
});
