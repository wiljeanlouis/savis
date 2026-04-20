import { createBrowserRouter, RouterProvider } from "react-router"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { MainLayout } from "@/app/layout/MainLayout"
import { RecipeList } from "@/features/recipe/pages/RecipeList"
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/shared/ui/breadcrumb";


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
              <BreadcrumbItem className="hidden md:block" key="1">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem key="2">
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
              <BreadcrumbItem className="hidden md:block" key="1">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem key="2">
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
              <BreadcrumbItem className="hidden md:block" key="1">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem key="2">
                <BreadcrumbPage>Recettes</BreadcrumbPage>
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