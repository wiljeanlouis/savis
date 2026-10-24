import { cn } from "@/shared/lib/utils";
import type { ProductType } from "../../types";
import {
  CatalogProductGuide,
  type CatalogProductGuideSection,
} from "../CatalogProductGuideDrawer";

export interface CatalogProductNavigationItem {
  id: CatalogProductGuideSection;
  label: string;
}

export function CatalogProductEditorNavigation({
  items,
  activeSection,
  productType,
  onSectionChange,
}: {
  items: CatalogProductNavigationItem[];
  activeSection: CatalogProductGuideSection;
  productType: ProductType;
  onSectionChange: (section: CatalogProductGuideSection) => void;
}) {
  return (
    <aside className="sticky top-16 z-30 -mx-2 border-b bg-background/95 px-2 backdrop-blur xl:top-20 xl:mx-0 xl:self-start xl:border-b-0 xl:bg-transparent xl:px-0 xl:backdrop-blur-none">
      <p className="mb-2 hidden text-xs font-medium tracking-wide text-muted-foreground uppercase xl:block">
        Dans cette page
      </p>
      <div className="flex min-w-0 items-center gap-2 xl:block">
        <nav
          aria-label="Sections du produit"
          className="flex min-w-0 flex-1 overflow-x-auto xl:-ml-px xl:flex-col xl:overflow-visible xl:border-l"
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={activeSection === item.id ? "location" : undefined}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "border-b-2 border-transparent px-3 py-2 text-xs whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:border-b-0 xl:border-l-2",
                activeSection === item.id &&
                  "border-primary bg-primary/10 text-foreground",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="shrink-0 border-l pl-2 xl:mt-3 xl:border-l-0 xl:pl-0">
          <CatalogProductGuide
            section={activeSection}
            productType={productType}
          />
        </div>
      </div>
    </aside>
  );
}
