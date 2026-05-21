import { Button } from "@/shared/ui/button";
import { NavLink, useLocation } from "react-router";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import { DashboardSquare01Icon, SearchIcon } from "@hugeicons/core-free-icons";
import { activeClass } from "../AppSidebar";

export const NavMain = () => {
  const { pathname } = useLocation();
  const isDashboardActive = pathname.startsWith("/dashboard");

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Dashboard"
              className={`min-w-8 ${isDashboardActive ? activeClass : ""}`}
              isActive={isDashboardActive}
              asChild
            >
              <NavLink to="/dashboard" state={{ title: "Dashboard" }}>
                <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
                <span>Dashboard</span>
              </NavLink>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
              <span className="sr-only">Search</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
