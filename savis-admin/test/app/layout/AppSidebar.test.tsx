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
  it("displays the SAVIS version at the bottom of the menu", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("dev").parentElement).toHaveTextContent(
      "version dev",
    );
  });
});
