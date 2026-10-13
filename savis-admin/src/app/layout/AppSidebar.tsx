import * as React from "react";

import { NavMain } from "@/app/layout/components/NavMain";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  Settings05Icon,
  HelpCircleIcon,
  Database01Icon,
  Analytics01Icon,
  PackageIcon,
  GearsFreeIcons,
  ShoppingCart02Icon,
  Clock03Icon,
} from "@hugeicons/core-free-icons";
import { Link } from "react-router";
import { NavSection } from "./components/NavSection";

const savisVersion = import.meta.env.VITE_SAVIS_VERSION?.trim() || "dev";

export const activeClass =
  "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  operations: [
    {
      name: "Ventes",
      url: "/sales/orders",
      activeUrls: ["/sales", "/quotations", "/orders", "/invoices"],
      icon: <HugeiconsIcon icon={ShoppingCart02Icon} strokeWidth={2} />,
    },
    {
      name: "Produits",
      url: "/catalog-products",
      icon: <HugeiconsIcon icon={PackageIcon} strokeWidth={2} />,
    },
  ],
  configs: [
    {
      name: "Taux horaire",
      url: "/activity-rates",
      icon: <HugeiconsIcon icon={Clock03Icon} strokeWidth={2} />,
    },
    {
      name: "BOM",
      icon: <HugeiconsIcon icon={GearsFreeIcons} strokeWidth={2} />,
      children: [
        {
          name: "Composants",
          url: "/bom-components",
        },
        {
          name: "Compositions",
          url: "/boms",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: <HugeiconsIcon icon={Database01Icon} strokeWidth={2} />,
    },
    {
      name: "Reports",
      url: "#",
      icon: <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} />,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: <HugeiconsIcon icon={File01Icon} strokeWidth={2} />,
    },
  ],
};

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/">
                <div className="size-5!">
                  <img src="/favicon.ico" alt="" />
                </div>
                <span className="text-base font-semibold">SAVIS Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavSection items={data.operations} />
        <NavSection title="Configuration" items={data.configs} />
        {/* <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <p className="px-2 py-1 text-xs text-sidebar-foreground/60">
          version <span className="font-mono">{savisVersion}</span>
        </p>
      </SidebarFooter>
    </Sidebar>
  );
};
