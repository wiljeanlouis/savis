import { createBrowserRouter, RouterProvider } from "react-router"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { MainLayout } from "@/app/layout/MainLayout"
import { RecipeList } from "@/features/recipe/pages/RecipeList"
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/shared/ui/breadcrumb";
import { RecipePage } from "@/features/recipe/pages/RecipePage";


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
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block"/>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )
        },
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )
        },
      },
      {
        path: "/recipes",
        element: <RecipeList />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Recettes</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )
        },
      },
      {
        path: "/recipes/add",
        element: <RecipePage />,
        handle: {
          breadcrumb: () => (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/recipes">Recettes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Nouvelle recette</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )
        },
      },
    ],
  },
]);

export const AppRouter = () => {
  return (
    <RouterProvider router={router} />
  )
}