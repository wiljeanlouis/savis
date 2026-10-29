import { useLayoutEffect, useRef } from "react";
import { Badge } from "@/shared/ui/badge";
import type { Bom } from "@/features/bom/types";
import type { CatalogProduct } from "../types";
import { productCategories } from "../types";
import { CatalogProductImage } from "./CatalogProductImage";
import { CatalogProductDetailActions } from "./CatalogProductDetailActions";
import { CatalogProductCompositions } from "./CatalogProductCompositions";
import { CatalogProductPurchaseModes } from "./CatalogProductPurchaseModes";

interface Props {
  product: CatalogProduct;
  boms: Bom[];
  publishing: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}
export function CatalogProductDetails({ product, boms, ...actions }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    // As in the review workspace, reserve the real space below the panel's top.
    const updateHeight = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const top = Math.max(12, panel.getBoundingClientRect().top);
      panel.style.setProperty(
        "--catalog-detail-height",
        `${Math.max(0, window.innerHeight - top - 12)}px`,
      );
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.addEventListener("scroll", updateHeight, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("scroll", updateHeight, true);
    };
  }, []);
  return (
    <section
      ref={panelRef}
      aria-label="Détail du produit"
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card max-h-[var(--catalog-detail-height,calc(100dvh-2rem))]"
    >
      <header className="shrink-0 space-y-1.5 border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 [overflow-wrap:anywhere] text-lg leading-snug font-semibold">
            {product.name}
          </h2>
        </div>
        <p className="[overflow-wrap:anywhere] text-xs text-muted-foreground">
          {
            productCategories.find(
              (category) => category.value === product.category,
            )?.label
          }{" "}
          · {product.code}{" "}
          <Badge variant="outline" className="ml-1 text-muted-foreground">
            {product.published ? "Publié" : "Brouillon"}
          </Badge>
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[11px]">
            {product.commercialType === "SERVICE" ? "Service" : "Bien"}
          </Badge>
          <Badge variant="outline" className="text-[11px]">
            {
              {
                STANDARD: "Standard",
                SINGLE_CHOICE: "Choix unique",
                SINGLE_CHOICE_BUNDLE: "Formats composables",
                INGREDIENT_CUSTOMIZATION: "Ingrédients personnalisables",
              }[product.productType]
            }
          </Badge>
          {!product.available && (
            <Badge variant="secondary" className="text-[11px]">
              Indisponible
            </Badge>
          )}
        </div>
      </header>
      <div
        role="region"
        aria-label="Informations du produit"
        tabIndex={0}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        <div className="flex items-start gap-3">
          <CatalogProductImage
            src={product.imageUrl}
            name={product.name}
            className="size-20 object-contain sm:size-24"
          />
          <p className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-relaxed text-muted-foreground">
            {product.description.trim() || "Aucune description"}
          </p>
        </div>
        <CatalogProductPurchaseModes modes={product.purchaseModes} />
        <CatalogProductCompositions product={product} boms={boms} />
        {product.availabilityNote && (
          <section
            aria-label="Disponibilité"
            className="space-y-1 border-t pt-3"
          >
            <h3 className="text-sm font-semibold">Disponibilité</h3>
            <p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-xs leading-relaxed text-muted-foreground">
              {product.availabilityNote}
            </p>
          </section>
        )}
      </div>
      <CatalogProductDetailActions product={product} {...actions} />
    </section>
  );
}
