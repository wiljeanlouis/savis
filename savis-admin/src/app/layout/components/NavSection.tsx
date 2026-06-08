"use client";

import { NavLink, useLocation } from "react-router";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/shared/ui/sidebar";
import { activeClass } from "../AppSidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

interface NavItem {
  name: string;
  url?: string;
  icon: React.ReactNode;
  children?: {
    name: string;
    url: string;
  }[];
}

interface Props {
  title: string;
  items: NavItem[];
}

export function NavSection({ title, items }: Props) {
  const { pathname } = useLocation();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isChildActive = item.children?.some((child) =>
            pathname.startsWith(child.url),
          );

          if (item.children) {
            return (
              <Collapsible
                key={item.name}
                asChild
                defaultOpen={isChildActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isChildActive}
                      className={isChildActive ? activeClass : undefined}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        strokeWidth={2}
                        className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.children.map((child) => {
                        const isActive = pathname.startsWith(child.url);

                        return (
                          <SidebarMenuSubItem key={child.name}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive}
                              className="border border-transparent cursor-pointer transition-colors hover:border-primary hover:bg-sidebar-accent data-[active=true]:border-primary data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                            >
                              <NavLink to={child.url}>
                                <span>{child.name}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          if (!item.url) {
            return null;
          }

          const isActive = pathname.startsWith(item.url);
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={isActive ? activeClass : undefined}
              >
                <NavLink to={item.url}>
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
