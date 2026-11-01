import { SalesLayout } from "@/features/sales/pages/SalesLayout";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Navigate, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

function createSalesRouter(initialEntry: string) {
  return createMemoryRouter(
    [
      {
        path: "/sales",
        element: <SalesLayout />,
        children: [
          { index: true, element: <Navigate replace to="/sales/orders" /> },
          { path: "quotations", element: <p>Liste des soumissions</p> },
          { path: "quote-requests", element: <p>Liste des demandes</p> },
          {
            path: "quote-requests/:requestId",
            element: <p>Détail de demande</p>,
          },
          { path: "orders", element: <p>Liste des commandes</p> },
          { path: "invoices", element: <p>Liste des factures</p> },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  );
}

describe("SalesLayout", () => {
  it("keeps requests selected when consulting a request detail", async () => {
    const router = createSalesRouter("/sales/quote-requests/test");
    render(<RouterProvider router={router} />);
    expect(screen.getByText("Détail de demande")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Demandes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("opens orders by default", async () => {
    const router = createSalesRouter("/sales");

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Liste des commandes")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/sales/orders");
  });

  it("keeps the selected tab in the URL and supports browser history", async () => {
    const user = userEvent.setup();
    const router = createSalesRouter("/sales/quotations");

    render(<RouterProvider router={router} />);

    expect(screen.getByText("Liste des soumissions")).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toHaveClass(
      "w-full",
      "grid-cols-4",
      "group-data-horizontal/tabs:h-10",
      "sm:w-fit",
    );
    expect(screen.getByRole("tab", { name: "Soumissions" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("tab", { name: "Soumissions" }).querySelector("svg"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Commandes" }).querySelector("svg"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Factures" }).querySelector("svg"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Factures" }));
    expect(screen.getByText("Liste des factures")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/sales/invoices");

    await act(async () => {
      await router.navigate(-1);
    });
    expect(screen.getByText("Liste des soumissions")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/sales/quotations");
  });
});
