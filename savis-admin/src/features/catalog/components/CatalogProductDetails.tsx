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
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent max-h-[var(--catalog-detail-height,calc(100dvh-2rem))]"
    >
      <div
        role="region"
        aria-label="Informations du produit"
        tabIndex={0}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pt-1 pb-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        <ProductIdentityHeader product={product} />
        <div className="space-y-4">
          <CatalogProductPurchaseModes modes={product.purchaseModes} />
          <CatalogProductCompositions product={product} boms={boms} />
          <section className="border-t pt-3">
            <h3 className="text-sm font-semibold">
              Description et informations complémentaires
            </h3>
            <div className="mt-3 space-y-4">
              <p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-relaxed text-muted-foreground">
                {product.description.trim() || "Aucune description"}
              </p>
              {product.availabilityNote && (
                <section aria-label="Disponibilité" className="space-y-1">
                  <h3 className="text-sm font-semibold">Disponibilité</h3>
                  <p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-relaxed text-muted-foreground">
                    {product.availabilityNote}
                  </p>
                </section>
              )}
            </div>
          </section>
        </div>
      </div>
      <CatalogProductDetailActions product={product} {...actions} />
    </section>
  );
}

function ProductIdentityHeader({ product }: { product: CatalogProduct }) {
  return (
    <header className="space-y-4">
      <div className="flex h-[300px] items-center justify-center">
        <CatalogProductImage
          src={product.imageUrl}
          name={product.name}
          className="size-[300px] max-w-full rounded-lg border-0 bg-white object-contain p-2"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 [overflow-wrap:anywhere] text-xl leading-snug font-semibold tracking-tight">
            {product.name}
          </h2>
          <Badge variant={product.published ? "secondary" : "outline"}>
            {product.published ? "Publié" : "Brouillon"}
          </Badge>
        </div>
        <p className="[overflow-wrap:anywhere] text-sm text-muted-foreground">
          {
            productCategories.find(
              (category) => category.value === product.category,
            )?.label
          }{" "}
          · {product.code}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            {product.commercialType === "SERVICE" ? "Service" : "Bien"}
          </span>
          <span>
            {
              {
                STANDARD: "Standard",
                SINGLE_CHOICE: "Choix unique",
                SINGLE_CHOICE_BUNDLE: "Formats composables",
                INGREDIENT_CUSTOMIZATION: "Ingrédients personnalisables",
              }[product.productType]
            }
          </span>
          {!product.available && <Badge variant="outline">Indisponible</Badge>}
        </div>
      </div>
    </header>
  );
}
