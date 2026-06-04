import { createBrowserRouter, Link, RouterProvider } from "react-router";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { MainLayout } from "@/app/layout/MainLayout";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";
import { RecipePage } from "@/features/recipe/pages/RecipePage";
import { RecipesPage } from "@/features/recipe/pages/RecipesPage";
import { getRecipe } from "@/features/recipe/api/recipeApi";
import type { Recipe } from "@/features/recipe/types";
import { TasksPage } from "@/features/task/pages/TasksPage";
import { IngredientsPage } from "@/features/ingredient/pages/IngredientsPage";
import { ActivityRatesPage } from "@/features/activity-rate/pages/ActivityRatesPage";

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
        path: "/recipes",
        element: <RecipesPage />,
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
                <BreadcrumbPage>Recettes</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/recipes/add",
        element: <RecipePage />,
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
                  <Link to="/recipes">Recettes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Nouvelle recette</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/tasks",
        element: <TasksPage />,
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
                <BreadcrumbPage>Tasks</BreadcrumbPage>
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
        path: "/ingredients",
        element: <IngredientsPage />,
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
                <BreadcrumbPage>Ingrédients</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ),
        },
      },
      {
        path: "/recipes/:id",
        element: <RecipePage />,
        loader: async ({ params }): Promise<Recipe> => {
          if (!params.id) {
            return Promise.reject(new Error("Recipe ID is required"));
          }
          return getRecipe(params.id);
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
                  <Link to="/recipes">Recettes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Recette</BreadcrumbPage>
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
