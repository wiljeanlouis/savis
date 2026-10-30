import { Badge } from "@/shared/ui/badge";
import { CatalogProductImage } from "./CatalogProductImage";
import type { CatalogProduct } from "../types";
import { productCategories } from "../types";
import { startingPrice, productMoney } from "../model/catalogProductList";
export function CatalogProductCompactList({
  products,
  selectedId,
  onSelect,
}: {
  products: CatalogProduct[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul aria-label="Liste des produits" className="divide-y border-y">
      {products.map((product) => (
        <li key={product.id}>
          <button
            type="button"
            aria-label={`Consulter ${product.name}`}
            aria-pressed={product.id === selectedId}
            onClick={() => product.id && onSelect(product.id)}
            className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-l-[3px] border-transparent py-4 pr-3 pl-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px] aria-pressed:border-primary aria-pressed:bg-primary/10"
          >
            <CatalogProductImage
              src={product.imageUrl}
              name={product.name}
              className="size-10"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {product.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {
                  productCategories.find(
                    (category) => category.value === product.category,
                  )?.label
                }
              </span>
            </span>
            <span className="text-right">
              <span className="block text-sm font-semibold tabular-nums">
                {product.purchaseModes.filter((mode) => mode.active).length > 1
                  ? "Dès "
                  : ""}
                {productMoney(startingPrice(product))}
              </span>
              <Badge variant="outline" className="mt-1 text-muted-foreground">
                {product.published ? "Publié" : "Brouillon"}
              </Badge>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
