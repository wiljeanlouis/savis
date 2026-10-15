import { CatalogProductCard } from "@/features/catalog/components/CatalogProductCard";
import { emptyCatalogProduct } from "@/features/catalog/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const product = {
  ...emptyCatalogProduct("TASTING"),
  id: "product-1",
  code: "PROD-1",
  slug: "produit-1",
  name: "Produit test",
  imageUrl: "https://example.com/product.jpg",
};

describe("CatalogProductCard", () => {
  it("keeps the main product actions directly available on the card", () => {
    render(
      <CatalogProductCard
        product={product}
        boms={[]}
        saving={false}
        publishing={false}
        onAnalyze={vi.fn()}
        onPublish={vi.fn()}
        onUnpublish={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Modifier" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Analyser" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions" })).toBeInTheDocument();
  });
});
