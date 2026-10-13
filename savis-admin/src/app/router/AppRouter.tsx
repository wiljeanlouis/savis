import { createBrowserRouter, Link, RouterProvider } from "react-router";
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
import { OrdersPage } from "@/features/orders/pages/OrdersPage";
import { OrderDetailsPage } from "@/features/orders/pages/OrderDetailsPage";
import { QuotationsPage } from "@/features/quotations/pages/QuotationsPage";
import { QuotationDetailsPage } from "@/features/quotations/pages/QuotationDetailsPage";

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
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
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
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/quotations",
        element: <QuotationsPage />,
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
                <BreadcrumbPage>Soumissions</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/quotations/new",
        element: <QuotationDetailsPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/quotations">Soumissions</Link>
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
                  <Link to="/quotations">Soumissions</Link>
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
        path: "/orders",
        element: <OrdersPage />,
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
                <BreadcrumbPage>Commandes</BreadcrumbPage>
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
                  <Link to="/orders">Commandes</Link>
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
                  <Link to="/orders">Commandes</Link>
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
              <BreadcrumbItem>
                <BreadcrumbPage>Produits</BreadcrumbPage>
              </BreadcrumbItem>
            </>
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
              <BreadcrumbItem>
                <BreadcrumbPage>Compositions BOM</BreadcrumbPage>
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
                  <Link to="/boms">BOM</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Nouveau BOM</BreadcrumbPage>
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
              <BreadcrumbItem>
                <BreadcrumbPage>Taux horaire</BreadcrumbPage>
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
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/">Accueil</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Composants BOM</BreadcrumbPage>
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
                      <Link to="/bom-components">Composants BOM</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Tâches de récupération</BreadcrumbPage>
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
                  <Link to="/boms">BOM</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>BOM</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
