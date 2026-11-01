import { catalogReturnTo } from "@/features/catalog/model/catalogProductNavigation";
import { ResourcesPage } from "@/features/resource/pages/ResourcesPage";
import {
  createBrowserRouter,
  Link,
  Navigate,
  RouterProvider,
  useLocation,
  useMatch,
} from "react-router";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { MainLayout } from "@/app/layout/MainLayout";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";
import { BomPage } from "@/features/bom/pages/BomPage";
import { BomsPage } from "@/features/bom/pages/BomsPage";
import { getBom } from "@/features/bom/api/bomApi";
import type { Bom } from "@/features/bom/types";
import { BomComponentTasksPage } from "@/features/bom-component/task/pages/BomComponentTasksPage";
import { BomComponentsPage } from "@/features/bom-component/pages/BomComponentsPage";
import { ActivityRatesPage } from "@/features/activity-rate/pages/ActivityRatesPage";
import { CatalogProductAnalysisPage } from "@/features/catalog/pages/CatalogProductAnalysisPage";
import { CatalogProductsPage } from "@/features/catalog/pages/CatalogProductsPage";
import { CatalogProductEditorPage } from "@/features/catalog/pages/CatalogProductEditorPage";
import { OrdersPage } from "@/features/sales/orders/pages/OrdersPage";
import { OrderDetailsPage } from "@/features/sales/orders/pages/OrderDetailsPage";
import { QuotationsPage } from "@/features/sales/quotations/pages/QuotationsPage";
import { QuotationDetailsPage } from "@/features/sales/quotations/pages/QuotationDetailsPage";
import { InvoicesPage } from "@/features/sales/invoices/pages/InvoicesPage";
import { InvoiceDetailsPage } from "@/features/sales/invoices/pages/InvoiceDetailsPage";
import { SalesLayout } from "@/features/sales/pages/SalesLayout";
import { SupplyOffersPage } from "@/features/supply-offer/pages/SupplyOffersPage";

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    hydrateFallbackElement: (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center text-muted-foreground"
      >
        Chargement…
      </div>
    ),
    children: [
      {
        path: "/resources",
        element: <ResourcesPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/boms">Production</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Ressources matérielles</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/",
        element: <DashboardPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Tableau de bord</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Tableau de bord</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/sales",
        element: <SalesLayout />,
        children: [
          {
            index: true,
            element: <Navigate replace to="/sales/orders" />,
          },
          {
            path: "quotations",
            element: <QuotationsPage />,
            handle: {
              breadcrumb: () => <SalesBreadcrumb section="Soumissions" />,
            },
          },
          {
            path: "orders",
            element: <OrdersPage />,
            handle: {
              breadcrumb: () => <SalesBreadcrumb section="Commandes" />,
            },
          },
          {
            path: "invoices",
            element: <InvoicesPage />,
            handle: {
              breadcrumb: () => <SalesBreadcrumb section="Factures" />,
            },
          },
        ],
      },
      {
        path: "/quotations",
        element: <Navigate replace to="/sales/quotations" />,
      },
      {
        path: "/orders",
        element: <Navigate replace to="/sales/orders" />,
      },
      {
        path: "/invoices",
        element: <Navigate replace to="/sales/invoices" />,
      },
      {
        path: "/quotations/new",
        element: <QuotationDetailsPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/sales/orders">Ventes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/sales/quotations">Soumissions</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Nouvelle soumission</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/quotations/:quotationId",
        element: <QuotationDetailsPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/sales/orders">Ventes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/sales/quotations">Soumissions</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Détail</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/invoices/:invoiceId",
        element: <InvoiceDetailsPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/sales/orders">Ventes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/sales/invoices">Factures</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Détail</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/orders/new",
        element: <OrderDetailsPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/sales/orders">Ventes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/sales/orders">Commandes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Nouvelle commande</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/orders/:orderId",
        element: <OrderDetailsPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/sales/orders">Ventes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/sales/orders">Commandes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Détail</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/catalog-products",
        element: <CatalogProductsPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/catalog-products">Catalogue</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Produits</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/catalog-products/:productId/analysis",
        element: <CatalogProductAnalysisPage />,
        handle: {
          breadcrumb: () => (
            <CatalogProductEditorBreadcrumb section="Analyse de rentabilité" />
          ),
        },
      },
      {
        path: "/catalog-products/new",
        element: <CatalogProductEditorPage />,
        handle: {
          breadcrumb: () => (
            <CatalogProductEditorBreadcrumb section="Nouveau produit" />
          ),
        },
      },
      {
        path: "/catalog-products/:productId/edit",
        element: <CatalogProductEditorPage />,
        handle: {
          breadcrumb: () => (
            <CatalogProductEditorBreadcrumb section="Modifier" />
          ),
        },
      },
      {
        path: "/boms",
        element: <BomsPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/boms">Production</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Compositions</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/boms/add",
        element: <BomPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/boms">Production</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/boms">Compositions</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Nouvelle composition</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/activity-rates",
        element: <ActivityRatesPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/activity-rates">Production</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Activités et taux horaires</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/offers",
        children: [
          {
            index: true,
            element: <BomComponentsPage />,
            handle: {
              breadcrumb: () => <ProcurementBreadcrumb section="À valider" />,
            },
          },
          {
            path: "tasks",
            element: <BomComponentTasksPage />,
            handle: {
              breadcrumb: () => (
                <ProcurementBreadcrumb section="Tâches d'acquisition" />
              ),
            },
          },
        ],
      },
      {
        path: "/supply/offers",
        element: <SupplyOffersPage />,
        handle: {
          breadcrumb: () => (
            <ProcurementBreadcrumb section="Offres fournisseurs" />
          ),
        },
      },
      {
        path: "/supply-offers",
        children: [
          {
            index: true,
            element: <Navigate to="/supply/offers" replace />,
            handle: {
              breadcrumb: () => (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/">Accueil</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/supply-offers">Approvisionnement</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Offres fournisseurs</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ),
            },
          },
          {
            path: "tasks",
            element: <BomComponentTasksPage />,
            handle: {
              breadcrumb: () => (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/">Accueil</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/supply-offers">Approvisionnement</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/supply-offers">Offres fournisseurs</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Tâches d'acquisition</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ),
            },
          },
        ],
      },
      {
        path: "/boms/:id",
        element: <BomPage />,
        loader: async ({ params }): Promise<Bom> => {
          if (!params.id) {
            return Promise.reject(new Error("Bom ID is required"));
          }
          return getBom(params.id);
        },
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/boms">Production</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/boms">Compositions</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Composition</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
    ],
  },
]);

function SalesBreadcrumb({ section }: { section: string }) {
  return (
    <>
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink asChild>
          <Link to="/">Accueil</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink asChild>
          <Link to="/sales/orders">Ventes</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>{section}</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}

export function CatalogProductEditorBreadcrumb({
  section,
}: {
  section: string;
}) {
  const location = useLocation();
  const productRoute = useMatch("/catalog-products/:productId/:workspace");
  const returnTo = catalogReturnTo(
    location.search,
    productRoute?.params.productId,
  );
  return (
    <>
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink asChild>
          <Link to="/">Accueil</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink asChild>
          <Link to={returnTo}>Catalogue</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink asChild>
          <Link to={returnTo}>Produits</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>{section}</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}

export function ProcurementBreadcrumb({ section }: { section: string }) {
  return (
    <>
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink asChild>
          <Link to="/">Accueil</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink asChild>
          <Link to="/supply/offers">Approvisionnement</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>{section}</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
