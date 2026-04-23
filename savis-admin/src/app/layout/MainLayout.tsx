import { AppSidebar } from "@/app/layout/AppSidebar"
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar"
import { Header } from "@/app/layout/Header"
import { Outlet } from "react-router"
import { TooltipProvider } from "@/shared/ui/tooltip"

// export const MainLayout = ({ children }: { children: React.ReactNode }) => {
//   return (
//      <TooltipProvider>{children}</TooltipProvider>
//   )
// }

// export const MainLayout = () => {
//   return (
//     <div className="flex h-screen">
//       <Sidebar />

//       <div className="flex-1 flex flex-col">
//         <Header />
//         <main className="p-6 overflow-auto">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   )
// }

export const MainLayout = () => {
  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <Header />
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="mx-auto w-full max-w-6xl space-y-6">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}