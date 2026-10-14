import { AppSidebar } from "@/app/layout/AppSidebar";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/dashboard/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

describe("AppSidebar", () => {
  function renderSidebar(initialEntry = "/") {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );
  }

  it("displays the SAVIS version at the bottom of the menu", () => {
    renderSidebar();

    expect(screen.getByText("dev").parentElement).toHaveTextContent(
      "version dev",
    );
  });

  it("groups the available pages by business domain", () => {
    renderSidebar();

    fireEvent.click(screen.getByRole("button", { name: /Approvisionnement/ }));
    expect(
      screen.getByRole("link", { name: "Offres fournisseurs" }),
    ).toHaveAttribute("href", "/supply/offers");
    expect(
      screen.getByRole("link", { name: "Gestion des offres" }),
    ).toHaveAttribute("href", "/bom-components");
    expect(
      screen.getByRole("link", { name: "Tâches d'acquisition" }),
    ).toHaveAttribute("href", "/bom-components/tasks");

    fireEvent.click(screen.getByRole("button", { name: /Production/ }));
    expect(screen.getByRole("link", { name: "Compositions" })).toHaveAttribute(
      "href",
      "/boms",
    );
    expect(
      screen.getByRole("link", { name: "Activités et taux horaires" }),
    ).toHaveAttribute("href", "/activity-rates");
    fireEvent.click(screen.getByRole("button", { name: /Catalogue/ }));
    expect(screen.getByRole("link", { name: "Produits" })).toHaveAttribute(
      "href",
      "/catalog-products",
    );

    fireEvent.click(screen.getByRole("button", { name: /Ventes/ }));
    expect(screen.getByRole("link", { name: "Soumissions" })).toHaveAttribute(
      "href",
      "/sales/quotations",
    );
    expect(screen.getByRole("link", { name: "Commandes" })).toHaveAttribute(
      "href",
      "/sales/orders",
    );
    expect(screen.getByRole("link", { name: "Factures" })).toHaveAttribute(
      "href",
      "/sales/invoices",
    );
    expect(
      screen.queryByRole("link", { name: "Intrants" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Offres fournisseurs" }),
    ).toHaveLength(1);
  });

  it.each([
    ["/sales/quotations", "Soumissions"],
    ["/quotations/quotation-1", "Soumissions"],
    ["/sales/orders", "Commandes"],
    ["/orders/order-1", "Commandes"],
    ["/sales/invoices", "Factures"],
    ["/invoices/invoice-1", "Factures"],
  ])("highlights sales on %s", (initialEntry, activeLink) => {
    renderSidebar(initialEntry);

    expect(screen.getByRole("button", { name: /Ventes/ })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByRole("link", { name: activeLink })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(
      ["Soumissions", "Commandes", "Factures"].filter(
        (name) =>
          screen.getByRole("link", { name }).getAttribute("data-active") ===
          "true",
      ),
    ).toEqual([activeLink]);
  });

  it("highlights the catalog group and its product page", () => {
    renderSidebar("/catalog-products");

    expect(screen.getByRole("button", { name: /Catalogue/ })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByRole("link", { name: "Produits" })).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("highlights the read-only supplier offers page", () => {
    renderSidebar("/supply/offers");

    expect(
      screen.getByRole("link", { name: "Offres fournisseurs" }),
    ).toHaveAttribute("data-active", "true");
    expect(
      screen.getByRole("button", { name: /Approvisionnement/ }),
    ).toHaveAttribute("data-active", "true");
  });

  it("keeps management and acquisition tasks mutually exclusive", () => {
    renderSidebar("/bom-components/tasks");

    expect(
      screen.getByRole("link", { name: "Gestion des offres" }),
    ).toHaveAttribute("data-active", "false");
    expect(
      screen.getByRole("link", { name: "Tâches d'acquisition" }),
    ).toHaveAttribute("data-active", "true");
    expect(
      screen.getByRole("button", { name: /Approvisionnement/ }),
    ).toHaveAttribute("data-active", "true");
  });

  it("highlights offer management only on its own route", () => {
    renderSidebar("/bom-components");

    expect(
      screen.getByRole("link", { name: "Gestion des offres" }),
    ).toHaveAttribute("data-active", "true");
    expect(
      screen.getByRole("link", { name: "Tâches d'acquisition" }),
    ).toHaveAttribute("data-active", "false");
  });

  it("keeps the procurement group open while navigating between its routes", () => {
    renderSidebar("/supply/offers");

    fireEvent.click(screen.getByRole("link", { name: "Gestion des offres" }));

    expect(
      screen.getByRole("link", { name: "Gestion des offres" }),
    ).toHaveAttribute("data-active", "true");
    expect(
      screen.getByRole("link", { name: "Tâches d'acquisition" }),
    ).toBeVisible();
  });

  it.each([
    ["/boms", "Compositions"],
    ["/activity-rates", "Activités et taux horaires"],
  ])("highlights production on %s", (initialEntry, activeLink) => {
    renderSidebar(initialEntry);

    expect(screen.getByRole("button", { name: /Production/ })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByRole("link", { name: activeLink })).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("does not expose the historical supplier-offer route as a duplicate", () => {
    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: /Approvisionnement/ }));

    expect(screen.queryByRole("link", { name: "Intrants" })).toBeNull();
    expect(
      screen.getAllByRole("link", { name: "Offres fournisseurs" }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Offres fournisseurs" }),
    ).toHaveAttribute("href", "/supply/offers");
  });
});
