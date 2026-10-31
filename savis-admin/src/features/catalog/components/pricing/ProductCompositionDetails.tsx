import { Badge } from "@/shared/ui/badge";
import { Link } from "react-router";
import type { Bom } from "@/features/bom/types";
import type { CatalogProduct } from "../../types";

export function ProductCompositionDetails({
  product,
  boms,
  choiceCode,
  worstCase,
}: {
  product: CatalogProduct;
  boms: Bom[];
  choiceCode: string;
  worstCase: boolean;
}) {
  const rows = [
    ...product.productBoms.map((bom) => ({
      key: `base-${bom.id ?? `${bom.bomId}-${bom.displayOrder}`}`,
      role: "Base commune",
      bomId: bom.bomId,
      label: "Base commune cumulative",
      quantity: `Quantité associée : ${bom.quantity}`,
    })),
    ...(product.productType === "SINGLE_CHOICE" ||
    product.productType === "SINGLE_CHOICE_BUNDLE"
      ? (product.choiceGroup?.options ?? [])
          .filter(
            (option) =>
              option.active && (worstCase || option.code === choiceCode),
          )
          .map((option) => ({
            key: `choice-${option.id ?? option.code}`,
            role: "Choix",
            bomId: option.bomId,
            label: worstCase
              ? `Choix évalué au pire cas · ${option.name}`
              : `Choix sélectionné · ${option.name}`,
            quantity: "Selon le mode de vente",
          }))
      : []),
    ...(product.productType === "INGREDIENT_CUSTOMIZATION"
      ? product.ingredientOptions
          .filter((option) => option.active)
          .map((option) => ({
            key: `ingredient-${option.id ?? option.code}`,
            role: "Ingrédient",
            bomId: option.bomId,
            label: `Ingrédient · ${option.name}`,
            quantity: `Configuration par défaut : ${option.defaultQuantity}`,
          }))
      : []),
  ];
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h2 className="text-sm font-semibold">Détail des coûts · compositions</h2>
      <p className="text-sm text-muted-foreground">
        Les compositions de base contribuent ensemble au produit. Les montants
        et pourcentages de contribution par BOM ne sont pas exposés par
        l’analyse Catalog.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm">
          Aucune composition associée. Le calcul ne couvre aucun coût de BOM.
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => {
            const bom = boms.find((item) => item.id === row.bomId);
            return (
              <li
                key={row.key}
                className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <Badge variant="outline" className="text-[11px]">
                    {row.role}
                  </Badge>
                  <p className="font-medium [overflow-wrap:anywhere]">
                    {bom?.name ?? "Composition non renseignée"}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {row.label} · {row.quantity}
                    {bom &&
                      ` · Rendement : ${bom.yield.quantity} ${bom.yield.unit}`}
                  </p>
                </div>
                {row.bomId && (
                  <Link
                    aria-label={`Consulter les coûts de ${bom?.name ?? "la composition"}`}
                    className="justify-self-start rounded-sm text-xs underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary sm:justify-self-end"
                    to={`/boms/${row.bomId}`}
                  >
                    Consulter les coûts
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Les rendements et quantités sont appliqués par Catalog. Le détail de
        chaque composition présente sa valorisation propre, pas sa contribution
        au mode de vente.
      </p>
    </section>
  );
}
