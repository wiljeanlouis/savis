import {
  createBrowserRouter,
  Link,
  Navigate,
  RouterProvider,
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
import { CatalogProductsPage } from "@/features/catalog/pages/CatalogProductsPage";
import { CatalogProductEditorPage } from "@/features/catalog/pages/CatalogProductEditorPage";
import { OrdersPage } from "@/features/orders/pages/OrdersPage";
import { OrderDetailsPage } from "@/features/orders/pages/OrderDetailsPage";
import { QuotationsPage } from "@/features/quotations/pages/QuotationsPage";
import { QuotationDetailsPage } from "@/features/quotations/pages/QuotationDetailsPage";
import { InvoicesPage } from "@/features/invoices/pages/InvoicesPage";
import { InvoiceDetailsPage } from "@/features/invoices/pages/InvoiceDetailsPage";
import { SalesLayout } from "@/features/sales/pages/SalesLayout";
import { SupplyOffersPage } from "@/features/supply-offer/pages/SupplyOffersPage";

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
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
        path: "/bom-components",
        children: [
          {
            index: true,
            element: <BomComponentsPage />,
            handle: {
              breadcrumb: () => (
                <ProcurementBreadcrumb section="Gestion des offres" />
              ),
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
            element: <BomComponentsPage supplierOffers />,
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

function CatalogProductEditorBreadcrumb({ section }: { section: string }) {
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
          <Link to="/catalog-products">Catalogue</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink asChild>
          <Link to="/catalog-products">Produits</Link>
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
