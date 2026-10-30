import { Link } from "react-router";
import { Badge } from "@/shared/ui/badge";
import type { Bom } from "@/features/bom/types";
import type { CatalogProduct, Money } from "../types";
import { compositionCount } from "../model/catalogProductList";

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
      role: "base" as const,
      label: null,
      quantity: `Quantité : ${bom.quantity}`,
      supplement: null as Money | null,
      active: true,
    })),
    ...(product.choiceGroup?.options.map((option) => ({
      key: `choice-${option.id ?? option.code}`,
      bomId: option.bomId,
      role: "choice" as const,
      label: `${product.choiceGroup?.label || "Choix"} · ${option.name}`,
      quantity: null,
      supplement: null as Money | null,
      active: option.active,
    })) ?? []),
    ...product.ingredientOptions.map((option) => ({
      key: `ingredient-${option.id ?? option.code}`,
      bomId: option.bomId,
      role: "ingredient" as const,
      label: option.name,
      quantity: `Par défaut : ${option.defaultQuantity} · min. ${option.minQuantity} / max. ${option.maxQuantity}`,
      supplement: option.extraPrice,
      active: option.active,
    })),
  ];
  const groups = [
    {
      role: "base",
      title: "Compositions de base",
      rows: rows.filter((row) => row.role === "base"),
    },
    {
      role: "choice",
      title: "Choix",
      rows: rows.filter((row) => row.role === "choice"),
    },
    {
      role: "ingredient",
      title: "Ingrédients personnalisables",
      rows: rows.filter((row) => row.role === "ingredient"),
    },
  ].filter((group) => group.rows.length > 0);

  const renderRow = (row: (typeof rows)[number]) => (
    <li
      key={row.key}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 py-3 text-sm"
    >
      <div className="min-w-0 space-y-1">
        {!row.active && <Badge variant="secondary">Inactif</Badge>}
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
          <p className="[overflow-wrap:anywhere] text-sm text-muted-foreground">
            {row.label}
          </p>
        )}
        {row.quantity && (
          <p className="text-sm text-muted-foreground">{row.quantity}</p>
        )}
      </div>
      <div className="text-right">
        {row.supplement ? (
          <>
            <span className="block text-sm text-muted-foreground">
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
  );
  return (
    <section
      aria-labelledby="product-compositions-title"
      className="space-y-2 border-t pt-4"
    >
      <h3 id="product-compositions-title" className="text-sm font-semibold">
        Compositions ({compositionCount(product)})
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Les bases communes sont cumulatives ; les choix et ingrédients
        conservent leurs règles de personnalisation.
      </p>
      {!rows.length ? (
        <p className="text-sm text-muted-foreground">
          Aucune composition associée
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section
              key={group.role}
              aria-label={`${group.title} (${group.rows.length})`}
              className="space-y-1"
            >
              <h4 className="text-sm font-medium text-muted-foreground">
                {group.title} ({group.rows.length})
              </h4>
              <ul className="divide-y">{group.rows.map(renderRow)}</ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
