import { BrowserRouter, Routes, Route } from "react-router"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { MainLayout } from "@/app/layout/MainLayout"
import { RecipeList } from "@/features/recipe/pages/RecipeList"

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />}/>
          <Route path="/recipes" element={<RecipeList />}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}