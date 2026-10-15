import { useCatalogProductManagement } from "@/features/catalog/hooks/useCatalogProductManagement";
import { CatalogProductsPage } from "@/features/catalog/pages/CatalogProductsPage";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/catalog/hooks/useCatalogProductManagement", () => ({
  useCatalogProductManagement: vi.fn(),
}));

describe("CatalogProductsPage", () => {
  beforeEach(() => {
    vi.mocked(useCatalogProductManagement).mockReturnValue({
      products: [],
      boms: [],
      analysis: {},
      isLoading: false,
      isSaving: false,
      isPublishing: false,
      saveProduct: vi.fn(),
      deleteProduct: vi.fn(),
      publishProduct: vi.fn(),
      unpublishProduct: vi.fn(),
      runAnalysis: vi.fn(),
    });
  });

  it("opens product creation on its dedicated route", () => {
    render(
      <MemoryRouter>
        <CatalogProductsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "Ajouter un produit" }),
    ).toHaveAttribute("href", "/catalog-products/new");
  });
});
