import React, { Fragment } from "react";
import { Breadcrumb, BreadcrumbList } from "@/shared/ui/breadcrumb";
import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { useMatches } from "react-router";

interface RouteHandle {
  breadcrumb?: () => React.ReactNode;
}

export const Header = () => {
  const matches = useMatches();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-6"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {matches
              .filter(
                (match) =>
                  match.handle && (match.handle as RouteHandle).breadcrumb,
              )
              .map((match, index) => (
                <Fragment key={index}>
                  {(match.handle as RouteHandle).breadcrumb!()}
                </Fragment>
              ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
};
