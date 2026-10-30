import { Badge } from "@/shared/ui/badge";
import type { ProductPurchaseMode } from "../types";
import { productMoney } from "../model/catalogProductList";
export function CatalogProductPurchaseModes({
  modes,
}: {
  modes: ProductPurchaseMode[];
}) {
  return (
    <section aria-labelledby="product-modes-title" className="space-y-2">
      <h3 id="product-modes-title" className="text-base font-semibold">
        Modes de vente
      </h3>
      {!modes.length ? (
        <p className="text-sm text-muted-foreground">Aucun mode de vente</p>
      ) : (
        <ul className="divide-y">
          {[...modes]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((mode) => (
              <li
                key={mode.id ?? mode.code}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 [overflow-wrap:anywhere] font-medium">
                    {mode.label}
                    {!mode.active && (
                      <Badge variant="secondary" className="text-[11px]">
                        Inactif
                      </Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {mode.quantity} unité{mode.quantity > 1 ? "s" : ""} ·{" "}
                    {
                      {
                        NONE: "sans choix",
                        SINGLE_CHOICE: "un choix",
                        CHOICE_ALLOCATION: "choix répartis",
                      }[mode.allocationType]
                    }
                  </p>
                </div>
                <span className="text-right text-base font-semibold whitespace-nowrap tabular-nums">
                  {productMoney(mode.price)}
                </span>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
