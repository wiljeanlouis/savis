import {
  SalesWorkspaceDossierPage,
  SalesWorkspacePage,
} from "@/features/sales/workspace/pages/SalesWorkspacePage";
import type { SalesWorkspaceDossier } from "@/features/sales/workspace/api/workspaceApi";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  useMutation: () => ({
    mutate: mocks.mutate,
    mutateAsync: mocks.mutateAsync,
    isPending: false,
    isError: false,
  }),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
});

let dossier: SalesWorkspaceDossier;

const dossierFixture: SalesWorkspaceDossier = {
  id: "REQUEST:11111111-1111-4111-8111-111111111111",
  customerName: "Marie Tremblay",
  reference: "DEM-11111111",
  description: null,
  lastActivity: "2026-10-31T12:00:00Z",
  situation: "1 branche facturée · 1 soumission en attente",
  root: {
    type: "REQUEST" as const,
    id: "11111111-1111-4111-8111-111111111111",
    reference: "DEM-11111111",
    status: "QUOTED",
    paymentStatus: null,
    paidAt: null,
    issuedAt: null,
    amountCents: null,
    lastActivity: "2026-10-31T12:00:00Z",
    action: "Préparer une soumission",
    actionUrl: "/sales/quote-requests/11111111-1111-4111-8111-111111111111",
    warnings: [],
    children: [
      {
        type: "QUOTATION" as const,
        id: "22222222-2222-4222-8222-222222222222",
        reference: "SOU-0018",
        status: "ACCEPTED",
        paymentStatus: null,
        paidAt: null,
        issuedAt: null,
        amountCents: 12000,
        lastActivity: "2026-10-31T12:00:00Z",
        action: "Reprendre le brouillon",
        actionUrl: "/quotations/22222222-2222-4222-8222-222222222222",
        warnings: [],
        children: [
          {
            type: "ORDER" as const,
            id: "44444444-4444-4444-8444-444444444444",
            reference: "CMD-0024",
            status: "IN_PREPARATION",
            paymentStatus: null,
            paidAt: null,
            issuedAt: null,
            amountCents: 12000,
            lastActivity: "2026-10-31T12:00:00Z",
            action: "Créer une facture",
            actionUrl:
              "/invoices/new?orderId=44444444-4444-4444-8444-444444444444",
            warnings: [],
            children: [
              {
                type: "INVOICE" as const,
                id: "33333333-3333-4333-8333-333333333333",
                reference: "FAC-0009",
                status: "ISSUED",
                paymentStatus: "PAID",
                paidAt: "2026-02-02T12:00:00Z",
                issuedAt: "2026-01-30T12:00:00Z",
                amountCents: 12000,
                lastActivity: "2026-10-31T12:00:00Z",
                action: "Consulter la facture",
                actionUrl: "/invoices/33333333-3333-4333-8333-333333333333",
                warnings: [],
                children: [],
              },
            ],
          },
        ],
      },
      {
        type: "QUOTATION" as const,
        id: "66666666-6666-4666-8666-666666666666",
        reference: "SOU-0019",
        status: "SENT",
        paymentStatus: null,
        paidAt: null,
        issuedAt: null,
        amountCents: 24000,
        lastActivity: "2026-10-30T12:00:00Z",
        action: "Créer une commande",
        actionUrl:
          "/orders/new?quotationId=66666666-6666-4666-8666-666666666666",
        warnings: [],
        children: [
          {
            type: "ORDER" as const,
            id: "77777777-7777-4777-8777-777777777777",
            reference: "CMD-0025",
            status: "NEW",
            paymentStatus: null,
            paidAt: null,
            issuedAt: null,
            amountCents: 24000,
            lastActivity: "2026-10-30T12:00:00Z",
            action: null,
            actionUrl: null,
            warnings: [],
            children: [],
          },
        ],
      },
    ],
  },
};

const formatBusinessDate = (value: string) =>
  new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

function mount(initialEntry = "/sales/workspace") {
  const router = createMemoryRouter(
    [
      { path: "/sales/workspace", element: <SalesWorkspacePage /> },
      {
        path: "/sales/workspace/:dossierId",
        element: <SalesWorkspaceDossierPage />,
      },
      { path: "/sales/quote-requests/:requestId", element: <p>Demande</p> },
      { path: "/quotations/:quotationId", element: <p>Soumission</p> },
      { path: "/orders/:orderId", element: <p>Commande</p> },
      { path: "/orders/new", element: <p>Nouvelle commande</p> },
      { path: "/invoices/:invoiceId", element: <p>Facture</p> },
      { path: "/invoices/new", element: <p>Nouvelle facture</p> },
    ],
    { initialEntries: [initialEntry] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("Sales workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutateAsync.mockResolvedValue({
      fetchedCount: 0,
      importedCount: 0,
      alreadyImportedCount: 0,
      failedCount: 0,
      acknowledgmentFailedCount: 0,
      failures: [],
    });
    dossier = structuredClone(dossierFixture);
    mocks.useQuery.mockImplementation(
      ({ queryKey }: { queryKey: unknown[] }) =>
        queryKey.includes("dossier")
          ? { isPending: false, isError: false, data: dossier }
          : {
              isPending: false,
              isError: false,
              data: {
                content: [
                  {
                    id: dossier.id,
                    customerName: dossier.customerName,
                    reference: dossier.reference,
                    description: null,
                    lastActivity: dossier.lastActivity,
                    situation: dossier.situation,
                    documentCount: 4,
                  },
                ],
                totalElements: 1,
                totalPages: 1,
              },
            },
    );
  });

  it("importe les demandes et les commandes web depuis les dossiers commerciaux", async () => {
    const user = userEvent.setup();
    mount();

    await user.click(
      screen.getByRole("button", {
        name: "Importer les demandes et commandes",
      }),
    );

    expect(mocks.mutateAsync).toHaveBeenCalledOnce();
    expect(mocks.mutate).toHaveBeenCalledOnce();
  });

  it("affiche À traiter par défaut et garde l’ordre demandé des filtres", async () => {
    const router = mount();
    const actionRequiredTab = screen.getByRole("tab", { name: "À traiter" });
    const finishedTab = screen.getByRole("tab", { name: "Terminés" });
    const allTab = screen.getByRole("tab", { name: "Tous" });

    expect(actionRequiredTab).toHaveAttribute("aria-selected", "true");
    expect(
      actionRequiredTab.compareDocumentPosition(finishedTab) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      finishedTab.compareDocumentPosition(allTab) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await userEvent.setup().click(finishedTab);

    await waitFor(() => {
      expect(router.state.location.search).toBe("?filter=FINISHED");
    });
    expect(finishedTab).toHaveAttribute("aria-selected", "true");
  });

  it("rend le dossier identifiable et conserve le contexte de la liste", async () => {
    const listSearch = "?page=2&size=20&search=Marie&filter=FINISHED";
    const router = mount(`/sales/workspace${listSearch}`);
    const searchAndFilters = screen.getByRole("region", {
      name: "Recherche et filtres des dossiers",
    });
    const searchInput = screen.getByRole("textbox", {
      name: "Rechercher un client ou une référence",
    });
    expect(searchInput).toHaveAttribute(
      "placeholder",
      "Rechercher un client ou une référence",
    );
    const searchButton = screen.getByRole("button", { name: "Rechercher" });
    expect(searchButton).toBeInTheDocument();
    expect(searchInput.parentElement?.parentElement).toContainElement(
      searchButton,
    );
    expect(searchAndFilters).toContainElement(screen.getByRole("tablist"));
    expect(searchAndFilters).toHaveClass("sm:flex-row");

    expect(screen.getByText("Marie Tremblay")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Ouvrir le dossier DEM-11111111 pour Marie Tremblay",
      }),
    ).toHaveAttribute(
      "href",
      `/sales/workspace/REQUEST%3A11111111-1111-4111-8111-111111111111${listSearch}`,
    );
    expect(
      screen.getByText("Marie Tremblay").closest("article"),
    ).toContainElement(
      screen.getByText("1 branche facturée · 1 soumission en attente"),
    );
    const dossierDetails = screen.getByTestId("workspace-dossier-details");
    expect(dossierDetails.closest('[data-slot="card-content"]')).toHaveClass(
      "grid-cols-1",
      "lg:grid-cols-2",
    );
    expect(dossierDetails).toHaveTextContent("DEM-11111111");
    expect(dossierDetails).toContainElement(
      screen.getByText("1 branche facturée · 1 soumission en attente"),
    );
    expect(dossierDetails).toContainElement(
      screen.getByText(/Dernière activité/),
    );
    expect(
      screen.getByText("Marie Tremblay").closest("article"),
    ).toContainElement(screen.getByText(/Dernière activité/));
    expect(
      screen.queryByRole("button", { name: "Ouvrir le dossier" }),
    ).not.toBeInTheDocument();

    const dossierLink = screen.getByRole("link", {
      name: "Ouvrir le dossier DEM-11111111 pour Marie Tremblay",
    });
    const user = userEvent.setup();
    for (let tabCount = 0; tabCount < 20; tabCount += 1) {
      if (document.activeElement === dossierLink) break;
      await user.tab();
    }
    expect(dossierLink).toHaveFocus();
    expect(dossierLink).toHaveClass("focus-visible:outline-2");
    await user.click(dossierLink);

    await waitFor(() => {
      expect(router.state.location.pathname).toContain("/sales/workspace/");
    });
    expect(
      screen.getByText("1 branche facturée · 1 soumission en attente"),
    ).toBeInTheDocument();
    expect(screen.getByText("SOU-0018")).toBeInTheDocument();
    expect(screen.getByText("FAC-0009")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-icon-request")).toBeInTheDocument();
    expect(screen.getAllByTestId("workspace-icon-quotation")).toHaveLength(2);
    expect(screen.getAllByTestId("workspace-icon-order")).toHaveLength(2);
    expect(screen.getByTestId("workspace-icon-invoice")).toBeInTheDocument();
    expect(
      screen.queryByTestId("workspace-icon-payment"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Tous les dossiers/ }),
    ).toHaveAttribute("href", `/sales/workspace${listSearch}`);
    expect(screen.getByRole("link", { name: "SOU-0018" })).toHaveClass(
      "text-primary",
      "hover:underline",
    );
    expect(
      screen.queryByRole("link", { name: "Consulter la facture" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Préparer une soumission" }),
    ).toBeInTheDocument();
    const requestHeader = screen
      .getByRole("link", { name: "DEM-11111111" })
      .closest('[data-testid="workspace-node-header"]');
    expect(requestHeader).toHaveClass("flex", "flex-wrap");
    expect(requestHeader).toContainElement(
      screen.getByRole("link", { name: "Préparer une soumission" }),
    );
    expect(requestHeader).toContainElement(
      screen.getByRole("button", {
        name: "Afficher ou masquer les documents liés à DEM-11111111",
      }),
    );
    expect(
      requestHeader?.querySelector('[data-testid="workspace-node-controls"]'),
    ).toHaveClass("flex", "flex-wrap", "gap-1");
    expect(
      screen.getByRole("link", { name: "Reprendre le brouillon" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Créer une facture" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Créer une commande" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("/orders/new?quotationId="),
    );
    expect(screen.getByText("SOU-0019")).toBeInTheDocument();
    expect(screen.getByText("CMD-0025")).toBeInTheDocument();
    expect(screen.getByText("Émise")).toBeInTheDocument();
    expect(screen.getAllByText("Payée")).toHaveLength(1);
    expect(screen.getByText("Payée")).toHaveClass(
      "border-emerald-600/40",
      "bg-emerald-50",
      "text-emerald-800",
    );
    expect(screen.getByText("Émise")).toHaveClass(
      "border-blue-600/40",
      "bg-blue-50",
      "text-blue-800",
    );
    expect(screen.queryByText("Facturation :")).not.toBeInTheDocument();
    expect(screen.queryByText("Paiement :")).not.toBeInTheDocument();
    expect(screen.queryByText("PAI-0004")).not.toBeInTheDocument();
    expect(screen.getAllByText(/120,00/)).toHaveLength(3);
    expect(screen.getByText("SOU-0018").parentElement).toHaveTextContent(
      /120,00/,
    );
    expect(
      screen.getByText("SOU-0018").parentElement?.lastElementChild,
    ).toHaveClass("text-muted-foreground");
    expect(screen.getByText("CMD-0024").parentElement).toHaveTextContent(
      /120,00/,
    );
    expect(screen.getByText("SOU-0019").parentElement).toHaveTextContent(
      /240,00/,
    );
    expect(screen.getByText("CMD-0025").parentElement).toHaveTextContent(
      /240,00/,
    );
    expect(
      screen.getByText("CMD-0025").parentElement?.lastElementChild,
    ).toHaveClass("text-muted-foreground");
    expect(
      screen.getByText("FAC-0009").parentElement?.lastElementChild,
    ).not.toHaveClass("text-muted-foreground");
    const expectNodeStatusDate = (
      status: string,
      type: "request" | "quotation" | "order",
      date: string,
    ) => {
      expect(
        screen
          .getByText(status)
          .closest(`[data-testid="workspace-status-line-${type}"]`)
          ?.querySelector("time"),
      ).toHaveAttribute("datetime", date);
    };
    expectNodeStatusDate("Soumission créée", "request", "2026-10-31T12:00:00Z");
    expectNodeStatusDate("Acceptée", "quotation", "2026-10-31T12:00:00Z");
    expectNodeStatusDate("En préparation", "order", "2026-10-31T12:00:00Z");
    expectNodeStatusDate("Envoyée", "quotation", "2026-10-30T12:00:00Z");
    expectNodeStatusDate("Nouvelle", "order", "2026-10-30T12:00:00Z");
    expect(screen.getByText("FAC-0009").closest("a")).toHaveAttribute(
      "href",
      expect.stringContaining("/invoices/"),
    );
    expect(
      document.querySelector('time[datetime="2026-01-30T12:00:00Z"]'),
    ).toHaveTextContent(formatBusinessDate("2026-01-30T12:00:00Z"));
    expect(
      document.querySelector('time[datetime="2026-02-02T12:00:00Z"]'),
    ).toHaveTextContent(formatBusinessDate("2026-02-02T12:00:00Z"));
    expect(
      new URL(
        screen
          .getByRole("link", { name: "Créer une facture" })
          .getAttribute("href")!,
        window.location.origin,
      ).pathname,
    ).toBe("/invoices/new");

    const documentLinks = [
      {
        reference: "DEM-11111111",
        pathname: "/sales/quote-requests/11111111-1111-4111-8111-111111111111",
      },
      {
        reference: "SOU-0018",
        pathname: "/quotations/22222222-2222-4222-8222-222222222222",
      },
      {
        reference: "SOU-0019",
        pathname: "/quotations/66666666-6666-4666-8666-666666666666",
      },
      {
        reference: "FAC-0009",
        pathname: "/invoices/33333333-3333-4333-8333-333333333333",
      },
      {
        reference: "CMD-0024",
        pathname: "/orders/44444444-4444-4444-8444-444444444444",
      },
      {
        reference: "CMD-0025",
        pathname: "/orders/77777777-7777-4777-8777-777777777777",
      },
    ];
    for (const { reference, pathname } of documentLinks) {
      const link = screen.getByRole("link", { name: reference });
      expect(link).toHaveAttribute("href");
      const target = new URL(
        link.getAttribute("href")!,
        window.location.origin,
      );
      expect(target.pathname).toBe(pathname);
      expect(target.searchParams.get("returnTo")).toBe(
        `/sales/workspace/${encodeURIComponent(dossier.id)}${listSearch}`,
      );
    }

    await user.click(screen.getByRole("link", { name: /Tous les dossiers/ }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/sales/workspace");
      expect(router.state.location.search).toBe(listSearch);
    });
  }, 10_000);

  it("affiche les deux statuts et leurs dates métier dans le nœud de facture", async () => {
    const invoiceData = dossier.root.children[0].children[0].children[0];
    invoiceData.paymentStatus = "UNPAID";
    invoiceData.paidAt = null;
    invoiceData.children = [];

    mount();
    fireEvent.click(
      screen.getByRole("link", {
        name: "Ouvrir le dossier DEM-11111111 pour Marie Tremblay",
      }),
    );
    await screen.findByText("FAC-0009");

    const invoiceDetails =
      screen.getByText("Émise").parentElement?.parentElement;
    expect(invoiceDetails).toHaveTextContent(
      formatBusinessDate("2026-01-30T12:00:00Z"),
    );
    expect(invoiceDetails).toHaveTextContent("Non payée");
    expect(screen.getByText("Non payée")).toHaveClass(
      "border-amber-600/40",
      "bg-amber-50",
      "text-amber-800",
    );
    expect(invoiceDetails).not.toHaveTextContent("Date non disponible");
    expect(invoiceDetails?.querySelectorAll("time")).toHaveLength(1);
    expect(screen.queryByText("Facturation :")).not.toBeInTheDocument();
    expect(screen.queryByText("Paiement :")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("workspace-icon-invoice")).toHaveLength(1);
    expect(
      screen.queryByTestId("workspace-icon-payment"),
    ).not.toBeInTheDocument();
  });

  it("n’invente pas une date pour une facture payée sans date de paiement exposée", async () => {
    const invoiceData = dossier.root.children[0].children[0].children[0];
    invoiceData.paymentStatus = "PAID";
    invoiceData.paidAt = null;

    mount();
    fireEvent.click(
      screen.getByRole("link", {
        name: "Ouvrir le dossier DEM-11111111 pour Marie Tremblay",
      }),
    );
    await screen.findByText("FAC-0009");

    const invoiceDetails =
      screen.getByText("Émise").parentElement?.parentElement;
    expect(invoiceDetails).toHaveTextContent("Payée");
    expect(invoiceDetails?.querySelectorAll("time")).toHaveLength(1);
  });

  it("affiche le sélecteur au-dessus des dossiers et conserve les filtres", async () => {
    const router = mount(
      "/sales/workspace?page=2&size=10&search=Marie&filter=FINISHED",
    );
    const pageSelector = screen.getByRole("combobox", {
      name: "Résultats par page",
    });
    const dossierCount = screen.getByText("1 dossier");
    const dossierLink = screen.getByRole("link", {
      name: "Ouvrir le dossier DEM-11111111 pour Marie Tremblay",
    });

    expect(
      dossierCount.compareDocumentPosition(pageSelector) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      pageSelector.compareDocumentPosition(dossierLink) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const user = userEvent.setup();
    await user.click(pageSelector);
    await user.click(screen.getByRole("option", { name: "20" }));

    await waitFor(() => {
      expect(router.state.location.search).toBe(
        "?size=20&search=Marie&filter=FINISHED",
      );
    });
    expect(
      screen.getAllByRole("combobox", { name: "Résultats par page" }),
    ).toHaveLength(1);
  });

  it("offre des branches repliables avec des statuts traduits", async () => {
    mount();
    fireEvent.click(
      screen.getByRole("link", {
        name: "Ouvrir le dossier DEM-11111111 pour Marie Tremblay",
      }),
    );
    await screen.findByText("SOU-0018");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Afficher ou masquer les documents liés à DEM-11111111",
      }),
    );
    await waitFor(() => {
      expect(screen.queryByText("SOU-0018")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Soumission créée")).toBeInTheDocument();
  });

  it("affiche des chevrons accessibles et garde les branches indépendantes", async () => {
    const router = mount();
    fireEvent.click(
      screen.getByRole("link", {
        name: "Ouvrir le dossier DEM-11111111 pour Marie Tremblay",
      }),
    );

    const rootToggle = await screen.findByRole("button", {
      name: "Afficher ou masquer les documents liés à DEM-11111111",
    });
    const quotationToggle = screen.getByRole("button", {
      name: "Afficher ou masquer les documents liés à SOU-0018",
    });
    const secondQuotationToggle = screen.getByRole("button", {
      name: "Afficher ou masquer les documents liés à SOU-0019",
    });
    expect(
      screen.getAllByRole("button", { name: /Afficher ou masquer/ }),
    ).toHaveLength(4);
    expect(
      screen.queryByRole("button", { name: /FAC-0009/ }),
    ).not.toBeInTheDocument();
    expect(rootToggle).toHaveAttribute("aria-expanded", "true");
    expect(quotationToggle).toHaveAttribute("aria-expanded", "true");
    expect(secondQuotationToggle).toHaveAttribute("aria-expanded", "true");

    expect(rootToggle).toContainElement(
      screen.getAllByTestId("workspace-chevron-expanded")[0],
    );
    expect(screen.getAllByTestId("workspace-chevron-expanded")[0]).toHaveClass(
      "rotate-180",
      "transition-transform",
    );
    expect(rootToggle).toHaveClass("border-0", "hover:bg-transparent");
    expect(
      screen.queryByTestId("workspace-chevron-collapsed"),
    ).not.toBeInTheDocument();

    const user = userEvent.setup();
    quotationToggle.focus();
    await user.keyboard("{Enter}");
    expect(quotationToggle).toHaveAttribute("aria-expanded", "false");
    expect(quotationToggle).toContainElement(
      screen.getByTestId("workspace-chevron-collapsed"),
    );
    expect(screen.getByTestId("workspace-chevron-collapsed")).toHaveClass(
      "rotate-0",
    );
    expect(rootToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("CMD-0024")).not.toBeInTheDocument();
    expect(screen.queryByText("FAC-0009")).not.toBeInTheDocument();
    expect(screen.getByText("SOU-0019")).toBeInTheDocument();
    expect(screen.getByText("CMD-0025")).toBeInTheDocument();

    await user.keyboard(" ");
    expect(quotationToggle).toHaveAttribute("aria-expanded", "true");
    expect(quotationToggle).toContainElement(
      screen.getAllByTestId("workspace-chevron-expanded")[1],
    );
    expect(
      screen.getByRole("button", {
        name: "Afficher ou masquer les documents liés à CMD-0024",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("FAC-0009")).toBeInTheDocument();

    secondQuotationToggle.focus();
    await user.keyboard("{Enter}");
    expect(secondQuotationToggle).toHaveAttribute("aria-expanded", "false");
    expect(quotationToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("SOU-0018")).toBeInTheDocument();
    expect(screen.queryByText("CMD-0025")).not.toBeInTheDocument();
    await user.keyboard(" ");
    expect(screen.getByText("CMD-0025")).toBeInTheDocument();

    rootToggle.focus();
    await user.keyboard(" ");
    expect(rootToggle).toHaveAttribute("aria-expanded", "false");
    expect(router.state.location.pathname).toContain("/sales/workspace/");
    expect(screen.queryByText("SOU-0018")).not.toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(rootToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("SOU-0018")).toBeInTheDocument();
    expect(screen.getByText("FAC-0009")).toBeInTheDocument();
    expect(screen.getByText("CMD-0024")).toBeInTheDocument();
    expect(screen.getByText("SOU-0019")).toBeInTheDocument();
    expect(screen.getByText("CMD-0025")).toBeInTheDocument();
  });

  it("ouvre le dossier et navigue dans les documents sans activer le repliage", async () => {
    const router = mount();
    fireEvent.click(
      screen.getByRole("link", {
        name: "Ouvrir le dossier DEM-11111111 pour Marie Tremblay",
      }),
    );
    await screen.findByRole("button", {
      name: "Afficher ou masquer les documents liés à DEM-11111111",
    });

    fireEvent.click(screen.getByRole("link", { name: "SOU-0018" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/quotations/22222222-2222-4222-8222-222222222222",
      );
    });
    expect(screen.getByText("Soumission")).toBeInTheDocument();
  });
});
