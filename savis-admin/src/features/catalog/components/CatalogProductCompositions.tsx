import { Link } from "react-router";
import { Badge } from "@/shared/ui/badge";
import type { Bom } from "@/features/bom/types";
import type { CatalogProduct, Money } from "../types";

export function CatalogProductCompositions({
  product,
  boms,
}: {
  product: CatalogProduct;
  boms: Bom[];
}) {
  const rows = [
    ...product.productBoms.map((bom) => ({
      key: `base-${bom.id ?? `${bom.bomId}-${bom.displayOrder}`}`,
      bomId: bom.bomId,
      role: "Base commune",
      label: null,
      quantity: `Quantité : ${bom.quantity}`,
      supplement: null as Money | null,
      active: true,
    })),
    ...(product.choiceGroup?.options.map((option) => ({
      key: `choice-${option.id ?? option.code}`,
      bomId: option.bomId,
      role: "Choix",
      label: `${product.choiceGroup?.label || "Choix"} · ${option.name}`,
      quantity: null,
      supplement: null as Money | null,
      active: option.active,
    })) ?? []),
    ...product.ingredientOptions.map((option) => ({
      key: `ingredient-${option.id ?? option.code}`,
      bomId: option.bomId,
      role: "Ingrédient",
      label: option.name,
      quantity: `Par défaut : ${option.defaultQuantity} · min. ${option.minQuantity} / max. ${option.maxQuantity}`,
      supplement: option.extraPrice,
      active: option.active,
    })),
  ];
  return (
    <section
      aria-labelledby="product-compositions-title"
      className="space-y-2 border-t pt-3"
    >
      <h3 id="product-compositions-title" className="text-sm font-semibold">
        Compositions
      </h3>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Les bases communes sont cumulatives ; les choix et ingrédients
        conservent leurs règles de personnalisation.
      </p>
      {!rows.length ? (
        <p className="text-sm text-muted-foreground">
          Aucune composition associée
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li
              key={row.key}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 py-2 text-sm"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[11px]">
                    {row.role}
                  </Badge>
                  {!row.active && (
                    <Badge variant="secondary" className="text-[11px]">
                      Inactif
                    </Badge>
                  )}
                </div>
                {row.bomId ? (
                  <Link
                    to={`/boms/${row.bomId}`}
                    className="block [overflow-wrap:anywhere] font-medium underline decoration-muted-foreground/50 underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {boms.find((bom) => bom.id === row.bomId)?.name ??
                      `Composition introuvable · ${row.bomId}`}
                  </Link>
                ) : (
                  <p>Aucune composition renseignée</p>
                )}
                {row.label && (
                  <p className="[overflow-wrap:anywhere] text-xs text-muted-foreground">
                    {row.label}
                  </p>
                )}
                {row.quantity && (
                  <p className="text-xs text-muted-foreground">
                    {row.quantity}
                  </p>
                )}
              </div>
              <div className="text-right">
                {row.supplement ? (
                  <>
                    <span className="block text-[11px] text-muted-foreground">
                      Supplément
                    </span>
                    <span className="whitespace-nowrap font-medium tabular-nums">
                      {new Intl.NumberFormat("fr-CA", {
                        style: "currency",
                        currency: row.supplement.currency,
                        signDisplay: "always",
                      }).format(row.supplement.amount)}
                    </span>
                  </>
                ) : (
                  <span
                    aria-label="Aucun supplément défini"
                    className="text-muted-foreground"
                  >
                    —
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
