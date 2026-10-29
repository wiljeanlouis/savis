import {
  ProcurementBreadcrumb,
  CatalogProductEditorBreadcrumb,
} from "@/app/router/AppRouter";
import { Breadcrumb, BreadcrumbList } from "@/shared/ui/breadcrumb";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

describe("AppRouter procurement breadcrumbs", () => {
  it.each(["Offres fournisseurs", "À valider", "Tâches d'acquisition"])(
    "renders the Approvisionnement hierarchy for %s",
    (section) => {
      render(
        <MemoryRouter>
          <Breadcrumb>
            <BreadcrumbList>
              <ProcurementBreadcrumb section={section} />
            </BreadcrumbList>
          </Breadcrumb>
        </MemoryRouter>,
      );

      expect(screen.getByRole("link", { name: "Accueil" })).toHaveAttribute(
        "href",
        "/",
      );
      expect(
        screen.getByRole("link", { name: "Approvisionnement" }),
      ).toHaveAttribute("href", "/supply/offers");
      expect(screen.getByText(section)).toHaveAttribute("aria-current", "page");
    },
  );
});

describe("Catalog product return breadcrumbs", () => {
  it.each(["analysis", "edit"])(
    "preserves product selection and list state from %s",
    (workspace) => {
      const target =
        "/catalog-products?selected=p1&page=3&size=10&search=pate&sort=name-desc&publication=PUBLISHED";
      render(
        <MemoryRouter
          initialEntries={[
            `/catalog-products/p1/${workspace}?${new URLSearchParams({ returnTo: target })}`,
          ]}
        >
          <Breadcrumb>
            <BreadcrumbList>
              <CatalogProductEditorBreadcrumb section="Analyse" />
            </BreadcrumbList>
          </Breadcrumb>
        </MemoryRouter>,
      );
      for (const name of ["Catalogue", "Produits"])
        expect(screen.getByRole("link", { name })).toHaveAttribute(
          "href",
          target,
        );
    },
  );
  it("selects the product when opened without a return destination", () => {
    render(
      <MemoryRouter
        initialEntries={["/catalog-products/p1/analysis?mode=DOZEN"]}
      >
        <Breadcrumb>
          <BreadcrumbList>
            <CatalogProductEditorBreadcrumb section="Analyse" />
          </BreadcrumbList>
        </Breadcrumb>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Produits" })).toHaveAttribute(
      "href",
      "/catalog-products?selected=p1",
    );
  });
});
