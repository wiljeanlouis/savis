"use client";

import { NavLink, useLocation } from "react-router";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { activeClass } from "../AppSidebar";

interface Props {
  title: string;
  items: {
    name: string;
    url: string;
    icon: React.ReactNode;
  }[];
}

export function NavSection({ title, items }: Props) {
  const { pathname } = useLocation();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.url)}
              className={
                pathname.startsWith(item.url) ? activeClass : undefined
              }
            >
              <NavLink to={item.url}>
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
