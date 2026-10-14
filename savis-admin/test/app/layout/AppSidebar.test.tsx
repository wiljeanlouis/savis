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

    fireEvent.click(screen.getByRole("button", { name: /Production/ }));
    expect(screen.getByRole("link", { name: "Intrants" })).toHaveAttribute(
      "href",
      "/bom-components",
    );
    expect(screen.getByRole("link", { name: "Compositions" })).toHaveAttribute(
      "href",
      "/boms",
    );
    expect(
      screen.getByRole("link", { name: "Activités et taux horaires" }),
    ).toHaveAttribute("href", "/activity-rates");
    expect(screen.getByRole("link", { name: "Catalogue" })).toHaveAttribute(
      "href",
      "/catalog-products",
    );
    expect(screen.getByRole("link", { name: "Ventes" })).toHaveAttribute(
      "href",
      "/sales/orders",
    );
    fireEvent.click(screen.getByRole("button", { name: /Approvisionnement/ }));
    expect(
      screen.getByRole("link", { name: "Offres fournisseurs" }),
    ).toHaveAttribute("href", "/supply-offers");
  });

  it.each([
    "/sales/quotations",
    "/quotations/quotation-1",
    "/sales/orders",
    "/orders/order-1",
    "/sales/invoices",
    "/invoices/invoice-1",
  ])("highlights sales on %s", (initialEntry) => {
    renderSidebar(initialEntry);

    expect(screen.getByRole("link", { name: "Ventes" })).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("highlights supplier offers on its task route", () => {
    renderSidebar("/supply-offers/tasks");

    expect(
      screen.getByRole("link", { name: "Offres fournisseurs" }),
    ).toHaveAttribute("data-active", "true");
    expect(
      screen.getByRole("button", { name: /Approvisionnement/ }),
    ).toHaveAttribute("data-active", "true");
  });
});
