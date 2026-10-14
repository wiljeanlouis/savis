import { ProcurementBreadcrumb } from "@/app/router/AppRouter";
import { Breadcrumb, BreadcrumbList } from "@/shared/ui/breadcrumb";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

describe("AppRouter procurement breadcrumbs", () => {
  it.each([
    "Offres fournisseurs",
    "Gestion des offres",
    "Tâches d'acquisition",
  ])("renders the Approvisionnement hierarchy for %s", (section) => {
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
  });
});
