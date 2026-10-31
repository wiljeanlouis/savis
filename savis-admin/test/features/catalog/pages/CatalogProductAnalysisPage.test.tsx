import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogProductAnalysisPage } from "@/features/catalog/pages/CatalogProductAnalysisPage";
import {
  emptyCatalogProduct,
  emptyPurchaseMode,
  type ProductPricingAnalysis,
} from "@/features/catalog/types";
import {
  getCatalogProduct,
  analyzeProductPricing,
  analyzeWorstCasePricing,
} from "@/features/catalog/api/catalogApi";
import { getBoms } from "@/features/bom/api/bomApi";
vi.mock("@/features/catalog/api/catalogApi", () => ({
  getCatalogProduct: vi.fn(),
  analyzeProductPricing: vi.fn(),
  analyzeWorstCasePricing: vi.fn(),
}));
vi.mock("@/features/bom/api/bomApi", () => ({ getBoms: vi.fn() }));
const cad = (amount: number) => ({ amount, currency: "CAD" });
const result: ProductPricingAnalysis = {
  analysisType: "CONFIGURATION",
  analyzedQuantity: 1,
  salePrice: cad(10),
  cost: cad(4),
  unitCost: cad(4),
  knownSubtotal: cad(4),
  actualMarginRate: 0.6,
  targetMarginRate: 0.3,
  recommendedPrice: cad(6),
  status: "GOOD",
  complete: true,
  missingBomIds: [],
  diagnostics: [],
};
const product = () => ({
  ...emptyCatalogProduct(),
  id: "p1",
  name: "Pâté cuit au four",
  purchaseModes: [
    { ...emptyPurchaseMode(), code: "UNIT", label: "Unité", price: cad(10) },
    {
      ...emptyPurchaseMode(),
      code: "DOZEN",
      label: "Douzaine",
      quantity: 12,
      price: cad(100),
    },
  ],
  productBoms: [
    { id: "a", bomId: "b1", quantity: 1, displayOrder: 0 },
    { id: "b", bomId: "b2", quantity: 2, displayOrder: 1 },
  ],
});
function RestoredList() {
  const location = useLocation();
  return (
    <output aria-label="Liste restaurée">
      {location.pathname}
      {location.search}
    </output>
  );
}
function renderPage(url = "/catalog-products/p1/analysis?mode=UNIT") {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/catalog-products" element={<RestoredList />} />
          <Route
            path="/catalog-products/:productId/analysis"
            element={<CatalogProductAnalysisPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
async function loaded() {
  await screen.findByRole("heading", { name: "Qualité du calcul" });
}
function metric(label: string) {
  return screen.getAllByText(label, { selector: "dt" })[0].parentElement!;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCatalogProduct).mockResolvedValue(product());
  vi.mocked(getBoms).mockResolvedValue(
    ["b1", "b2"].map((id, index) => ({
      id,
      name: index ? "Farce" : "Pâte",
      type: "FOOD",
      description: "",
      imageUrl: "",
      instructions: "",
      components: [],
      activities: [],
      yield: { quantity: 12, unit: "UNIT" },
    })),
  );
  vi.mocked(analyzeProductPricing).mockImplementation(
    async ({ configuration }) =>
      configuration.purchaseModeCode === "DOZEN"
        ? {
            ...result,
            salePrice: cad(100),
            cost: cad(55),
            analyzedQuantity: 12,
            actualMarginRate: 0.45,
          }
        : result,
  );
});
describe("Product pricing workspace", () => {
  it("loads financial values, cumulative BOMs and navigation", async () => {
    renderPage();
    await loaded();
    for (const [label, value] of [
      ["Prix de vente", "10,00"],
      ["Coût de revient estimé", "4,00"],
      ["Marge estimée", "6,00"],
      ["Marge sur vente", "60"],
    ])
      expect(metric(label)).toHaveTextContent(value);
    expect(metric("Prix de vente")).toHaveTextContent("CAD");
    expect(screen.getByText("Pâte")).toBeInTheDocument();
    expect(screen.getByText("Farce")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(getBoms).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("link", { name: "Modifier le produit" }),
    ).toHaveAttribute(
      "href",
      "/catalog-products/p1/edit?returnTo=%2Fcatalog-products%3Fselected%3Dp1",
    );
    expect(
      screen.getByRole("link", { name: "Retour aux produits" }),
    ).toHaveAttribute("href", "/catalog-products?selected=p1");
    expect(
      screen.getAllByRole("link", { name: /^Consulter les coûts/ })[0],
    ).toHaveAttribute("href", "/boms/b1");
  });
  it("restores selection, page and filters after changing the analysis mode", async () => {
    const target =
      "/catalog-products?search=pate&category=TASTING&publication=DRAFT&sort=name-desc&size=10&page=3&selected=p1";
    renderPage(
      `/catalog-products/p1/analysis?mode=UNIT&${new URLSearchParams({ returnTo: target })}`,
    );
    await loaded();
    fireEvent.change(screen.getByRole("combobox", { name: "Mode de vente" }), {
      target: { value: "DOZEN" },
    });
    await waitFor(() =>
      expect(metric("Coût de revient estimé")).toHaveTextContent("55,00"),
    );
    fireEvent.click(screen.getByRole("link", { name: "Retour aux produits" }));
    expect(screen.getByLabelText("Liste restaurée")).toHaveTextContent(target);
  });
  it("preserves the return destination when loading the product fails", async () => {
    vi.mocked(getCatalogProduct).mockRejectedValue(new Error("Indisponible"));
    const target = "/catalog-products?page=3&selected=p1";
    renderPage(
      `/catalog-products/p1/analysis?${new URLSearchParams({ returnTo: target })}`,
    );
    expect(
      await screen.findByRole("link", { name: "Retour aux produits" }),
    ).toHaveAttribute("href", target);
  });
  it("shows the configured objective, recommendation and quality in the financial summary", async () => {
    renderPage();
    await loaded();
    const summary = within(
      screen.getByRole("region", { name: "Synthèse financière" }),
    );
    expect(summary.getByText("Marge cible atteinte")).toBeInTheDocument();
    expect(
      summary.getByText("Objectif de marge sur vente").parentElement,
    ).toHaveTextContent("30");
    expect(
      summary.getByText("Prix recommandé").parentElement,
    ).toHaveTextContent("6,00");
    expect(summary.getByText("Coût complet")).toBeInTheDocument();
    expect(
      summary.getByRole("link", { name: /Voir la qualité/ }),
    ).toHaveAttribute("href", "#calculation-quality");
  });
  it("compares authoritative mode results in a table and selects a mode from its row", async () => {
    const target = "/catalog-products?page=3&selected=p1";
    renderPage(
      `/catalog-products/p1/analysis?${new URLSearchParams({ returnTo: target })}`,
    );
    await loaded();
    const table = within(
      screen.getByRole("table", { name: "Comparaison des modes de vente" }),
    );
    expect(table.getAllByRole("columnheader")).toHaveLength(7);
    const dozen = table.getByRole("button", {
      name: "Analyser le mode Douzaine",
    });
    expect(dozen.closest("tr")).toHaveTextContent("100,00");
    expect(dozen.closest("tr")).toHaveTextContent("55,00");
    expect(dozen.closest("tr")).toHaveTextContent("45,00");
    fireEvent.click(dozen);
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Mode de vente" }),
      ).toHaveValue("DOZEN"),
    );
    expect(dozen).toHaveAttribute("aria-pressed", "true");
    expect(dozen.closest("tr")).toHaveAttribute("data-selected", "true");
    expect(metric("Coût de revient estimé")).toHaveTextContent("55,00");
    expect(
      screen.getByRole("link", { name: "Retour aux produits" }),
    ).toHaveAttribute("href", target);
    expect(dozen.closest("tr")).toHaveClass("grid", "md:table-row");
  });
  it("shows the backend review status when the target is not reached", async () => {
    vi.mocked(analyzeProductPricing).mockResolvedValue({
      ...result,
      status: "REVIEW",
      salePrice: cad(5),
      actualMarginRate: 0.2,
    });
    renderPage();
    await loaded();
    expect(
      within(
        screen.getByRole("region", { name: "Synthèse financière" }),
      ).getByText("Prix à revoir"),
    ).toBeInTheDocument();
    expect(metric("Marge sur vente")).toHaveTextContent("20");
  });
  it("keeps zero sale prices and incomplete recommendations explicit", async () => {
    vi.mocked(analyzeProductPricing).mockResolvedValue({
      ...result,
      salePrice: cad(0),
      complete: false,
      cost: null,
      actualMarginRate: null,
      recommendedPrice: null,
    });
    renderPage();
    await loaded();
    expect(metric("Prix de vente")).toHaveTextContent("0,00");
    expect(metric("Marge sur vente")).toHaveTextContent("Non déterminable");
    const summary = within(
      screen.getByRole("region", { name: "Synthèse financière" }),
    );
    expect(
      summary.getByText("Prix recommandé").parentElement,
    ).toHaveTextContent("Non déterminable");
    expect(summary.getAllByText("Coût incomplet")).toHaveLength(2);
    expect(
      screen.queryByRole("img", { name: /Coût :/ }),
    ).not.toBeInTheDocument();
  });
  it("switches modes using backend costs", async () => {
    renderPage();
    await loaded();
    fireEvent.change(screen.getByRole("combobox", { name: "Mode de vente" }), {
      target: { value: "DOZEN" },
    });
    await waitFor(() =>
      expect(metric("Coût de revient estimé")).toHaveTextContent("55,00"),
    );
    expect(metric("Marge estimée")).toHaveTextContent("45,00");
  });
  it("suppresses unreliable margins and distinguishes diagnostics", async () => {
    vi.mocked(analyzeProductPricing).mockResolvedValue({
      ...result,
      complete: false,
      cost: null,
      actualMarginRate: null,
      diagnostics: [
        {
          bomId: "b1",
          source: "Pâte",
          code: "MISSING_PRICE",
          message: "Prix absent",
          blocking: true,
        },
        {
          bomId: null,
          source: "Offre",
          code: "STALE",
          message: "Prix ancien",
          blocking: false,
        },
      ],
    });
    renderPage();
    await loaded();
    expect(metric("Coût de revient estimé")).toHaveTextContent(
      "Coût incomplet",
    );
    expect(metric("Marge estimée")).toHaveTextContent("Non déterminable");
    expect(screen.getByText("Bloquant")).toBeInTheDocument();
    expect(screen.getByText("Avertissement")).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /Coût :/ }),
    ).not.toBeInTheDocument();
  });
  it("resolves diagnostic BOM UUIDs without extra requests or financial changes", async () => {
    const diagnostics = [
      {
        bomId: "b1",
        source: 'Ballon 10"',
        code: "OFFER_PRICE_MISSING",
        message: "Prix de l'offre absent",
        blocking: true,
      },
      {
        bomId: "b1",
        source: "Couverture blanche",
        code: "OFFER_NOT_FOUND",
        message: "Aucune offre disponible",
        blocking: true,
      },
      {
        bomId: "b2",
        source: "Arche métallique ronde",
        code: "OFFER_PRICE_MISSING",
        message: "Prix de l'offre absent",
        blocking: true,
      },
      {
        bomId: "deleted-bom",
        source: "Référence supprimée",
        code: "BOM_NOT_FOUND",
        message: "Composition introuvable",
        blocking: true,
      },
      {
        bomId: null,
        source: "Composition",
        code: "BOM_REFERENCE_MISSING",
        message: "Référence de composition absente",
        blocking: true,
      },
    ];
    const incomplete: ProductPricingAnalysis = {
      ...result,
      complete: false,
      status: "INCOMPLETE",
      cost: null,
      unitCost: null,
      actualMarginRate: null,
      recommendedPrice: null,
      missingBomIds: ["b1", "b2", "deleted-bom"],
      diagnostics,
    };
    const snapshot = structuredClone(incomplete);
    vi.mocked(analyzeProductPricing).mockResolvedValue(incomplete);
    renderPage();
    await loaded();
    const issues = within(
      screen.getByRole("list", { name: "Diagnostics de coût" }),
    );
    await waitFor(() =>
      expect(issues.getAllByText("Composition incomplète : Pâte")).toHaveLength(
        2,
      ),
    );
    expect(
      issues.getByRole("link", { name: "Composition incomplète : Farce" }),
    ).toHaveAttribute("href", "/boms/b2");
    for (const diagnostic of diagnostics) {
      const row = issues
        .getByText(diagnostic.source, { selector: "span.font-medium" })
        .closest("li")!;
      expect(row).toHaveTextContent(diagnostic.message);
      expect(within(row).getByText("Bloquant")).toBeInTheDocument();
    }
    expect(issues.getByText("deleted-bom")).toBeInTheDocument();
    expect(
      issues.queryByRole("link", { name: /introuvable/ }),
    ).not.toBeInTheDocument();
    expect(metric("Marge sur vente")).toHaveTextContent("Non déterminable");
    expect(metric("Marge estimée")).toHaveTextContent("Non déterminable");
    expect(metric("Coût de revient estimé")).toHaveTextContent(
      "Coût incomplet",
    );
    expect(metric("Prix recommandé")).toHaveTextContent("Non déterminable");
    expect(incomplete).toEqual(snapshot);
    expect(getBoms).toHaveBeenCalledTimes(1);
    expect(getCatalogProduct).toHaveBeenCalledTimes(1);
    expect(analyzeProductPricing).toHaveBeenCalledTimes(2);
    expect(analyzeWorstCasePricing).not.toHaveBeenCalled();
  });
  it("resolves incomplete BOM references even without detailed diagnostics", async () => {
    vi.mocked(analyzeProductPricing).mockResolvedValue({
      ...result,
      complete: false,
      missingBomIds: ["b1", "unknown"],
    });
    renderPage();
    await loaded();
    expect(
      await screen.findByRole("link", {
        name: "Composition incomplète : Pâte",
      }),
    ).toHaveAttribute("href", "/boms/b1");
    expect(screen.getByText("Composition introuvable")).toBeInTheDocument();
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });
  it("keeps diagnostics visible while names are loading or unavailable", async () => {
    let rejectNames!: (reason: Error) => void;
    vi.mocked(getBoms).mockReturnValue(
      new Promise((_, reject) => {
        rejectNames = reject;
      }),
    );
    vi.mocked(analyzeProductPricing).mockResolvedValue({
      ...result,
      complete: false,
      missingBomIds: ["b1"],
      diagnostics: [
        {
          bomId: "b1",
          source: "Ballon",
          code: "OFFER_PRICE_MISSING",
          message: "Prix absent",
          blocking: true,
        },
      ],
    });
    renderPage();
    await loaded();
    expect(
      screen.getByText("Nom de composition indisponible · b1"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Composition introuvable"),
    ).not.toBeInTheDocument();
    rejectNames(new Error("Indisponible"));
    await screen.findByText("Impossible de charger les noms des compositions.");
    expect(
      screen.queryByText("Composition introuvable"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Bloquant")).toBeInTheDocument();
    expect(getBoms).toHaveBeenCalledTimes(1);
  });
  it("shows losses separately", async () => {
    vi.mocked(analyzeProductPricing).mockResolvedValue({
      ...result,
      cost: cad(15),
      actualMarginRate: -0.5,
      status: "LOSS",
    });
    renderPage();
    await loaded();
    expect(metric("Marge estimée")).toHaveTextContent("-5,00");
    expect(
      within(
        screen.getByRole("region", { name: "Répartition des coûts" }),
      ).getByText(/Vente à perte/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /Coût :/ }),
    ).not.toBeInTheDocument();
  });
  it("preserves a known zero", async () => {
    vi.mocked(analyzeProductPricing).mockResolvedValue({
      ...result,
      cost: cad(0),
      actualMarginRate: 1,
    });
    renderPage();
    await loaded();
    expect(metric("Coût de revient estimé")).toHaveTextContent("0,00");
    expect(metric("Marge estimée")).toHaveTextContent("10,00");
  });
  it("handles an absent sale price", async () => {
    vi.mocked(analyzeProductPricing).mockResolvedValue({
      ...result,
      salePrice: null!,
      complete: false,
      cost: null,
    });
    renderPage();
    await loaded();
    expect(metric("Prix de vente")).toHaveTextContent("Non déterminable");
  });
  it("explains the absence of BOMs", async () => {
    vi.mocked(getCatalogProduct).mockResolvedValue({
      ...product(),
      productBoms: [],
    });
    renderPage();
    await loaded();
    expect(screen.getByText(/Aucune composition associée/)).toBeInTheDocument();
  });
  it("handles no active modes", async () => {
    vi.mocked(getCatalogProduct).mockResolvedValue({
      ...product(),
      purchaseModes: [],
    });
    renderPage();
    await screen.findByText(/Aucun mode de vente actif/);
    expect(analyzeProductPricing).not.toHaveBeenCalled();
  });
  it("shows loading and retryable errors", async () => {
    vi.mocked(analyzeProductPricing).mockRejectedValue(
      new Error("Service indisponible"),
    );
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Chargement");
    await screen.findByText("Impossible de calculer l’analyse.");
    expect(
      screen.getAllByRole("button", { name: "Réessayer" }).length,
    ).toBeGreaterThan(0);
  });
  it("supports real choices and comparisons", async () => {
    vi.mocked(getCatalogProduct).mockResolvedValue({
      ...product(),
      productType: "SINGLE_CHOICE",
      choiceGroup: {
        id: "g",
        required: true,
        label: "Saveur",
        options: ["Poulet", "Thon"].map((name) => ({
          id: name,
          code: name,
          name,
          bomId: "b2",
          active: true,
          displayOrder: 0,
        })),
      },
    });
    renderPage();
    await loaded();
    fireEvent.change(screen.getByRole("combobox", { name: "Saveur" }), {
      target: { value: "Thon" },
    });
    await waitFor(() =>
      expect(analyzeProductPricing).toHaveBeenCalledWith(
        expect.objectContaining({
          configuration: expect.objectContaining({ choiceCode: "Thon" }),
        }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Comparer les choix" }));
    expect(
      await screen.findByRole("heading", { name: "Résultats par choix" }),
    ).toBeInTheDocument();
  });
  it("uses worst-case analysis for allocated bundles", async () => {
    const data = product();
    vi.mocked(getCatalogProduct).mockResolvedValue({
      ...data,
      productType: "SINGLE_CHOICE_BUNDLE",
      purchaseModes: [
        { ...data.purchaseModes[0], allocationType: "CHOICE_ALLOCATION" },
      ],
    });
    vi.mocked(analyzeWorstCasePricing).mockResolvedValue({
      ...result,
      analysisType: "WORST_CASE",
    });
    renderPage();
    await loaded();
    expect(analyzeWorstCasePricing).toHaveBeenCalledWith({
      productId: "p1",
      purchaseModeCode: "UNIT",
    });
    expect(analyzeProductPricing).not.toHaveBeenCalled();
    expect(
      screen.getByText(/basée sur la combinaison de choix la plus coûteuse/),
    ).toBeInTheDocument();
  });
  it("supports decoration products", async () => {
    vi.mocked(getCatalogProduct).mockResolvedValue({
      ...product(),
      name: "Arche de ballons",
      category: "DECORATION",
      commercialType: "SERVICE",
    });
    renderPage();
    await loaded();
    expect(
      screen.getByRole("heading", { name: "Arche de ballons" }),
    ).toBeInTheDocument();
  });
});
