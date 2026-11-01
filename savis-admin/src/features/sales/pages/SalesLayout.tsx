import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  File01Icon,
  Money03Icon,
  ShoppingCart02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Outlet, useLocation, useNavigate } from "react-router";

const salesTabs = [
  {
    label: "Demandes",
    value: "quote-requests",
    to: "/sales/quote-requests",
    icon: File01Icon,
  },
  {
    label: "Soumissions",
    value: "quotations",
    to: "/sales/quotations",
    icon: File01Icon,
  },
  {
    label: "Commandes",
    value: "orders",
    to: "/sales/orders",
    icon: ShoppingCart02Icon,
  },
  {
    label: "Factures",
    value: "invoices",
    to: "/sales/invoices",
    icon: Money03Icon,
  },
] as const;

/** Hosts the sales lists while keeping the active section in the URL. */
export function SalesLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab =
    salesTabs.find(({ to }) => pathname === to || pathname.startsWith(`${to}/`))
      ?.value ?? "orders";

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => void navigate(`/sales/${value}`)}
      >
        <TabsList
          aria-label="Sections des ventes"
          className="grid w-full grid-cols-4 group-data-horizontal/tabs:h-10 sm:w-fit"
        >
          {salesTabs.map((tab) => (
            <TabsTrigger
              className="min-h-8 px-3 text-sm"
              key={tab.value}
              value={tab.value}
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={tab.icon}
                strokeWidth={2}
              />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Outlet />
    </div>
  );
}
