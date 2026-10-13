import { AppSidebar } from "@/app/layout/AppSidebar";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { render, screen } from "@testing-library/react";
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

  it("replaces the three commercial entries with the sales entry", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: /Ventes/ })).toHaveAttribute(
      "href",
      "/sales/orders",
    );
    expect(
      screen.queryByRole("link", { name: /^Soumissions$/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Commandes$/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Factures$/ }),
    ).not.toBeInTheDocument();
  });

  it.each([
    "/sales/quotations",
    "/sales/orders",
    "/sales/invoices",
    "/quotations/quotation-1",
    "/orders/order-1",
    "/invoices/invoice-1",
  ])("highlights sales for %s", (initialEntry) => {
    renderSidebar(initialEntry);

    expect(screen.getByRole("link", { name: /Ventes/ })).toHaveAttribute(
      "data-active",
      "true",
    );
  });
});
