import { Link } from "react-router";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CatalogProductImage } from "../CatalogProductImage";
import { catalogProductWorkspaceLink } from "../../model/catalogProductNavigation";
import type {
  CatalogProduct,
  ProductChoiceOption,
  ProductPurchaseMode,
} from "../../types";
export function ProductAnalysisHeader({
  product,
  returnTo,
  modes,
  choices,
  modeCode,
  choiceCode,
  worstCase,
  onModeChange,
  onChoiceChange,
}: {
  product: CatalogProduct;
  returnTo: string;
  modes: ProductPurchaseMode[];
  choices: ProductChoiceOption[];
  modeCode: string;
  choiceCode: string;
  worstCase: boolean;
  onModeChange: (code: string) => void;
  onChoiceChange: (code: string) => void;
}) {
  return (
    <header className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          className="rounded-sm text-xs text-muted-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
          to={returnTo}
        >
          Retour aux produits
        </Link>
        <Button variant="outline" size="sm" asChild>
          <Link to={catalogProductWorkspaceLink(product.id!, "edit", returnTo)}>
            Modifier le produit
          </Link>
        </Button>
      </div>
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <CatalogProductImage
            src={product.imageUrl}
            name={product.name}
            className="size-14 object-contain sm:size-16"
          />
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">
              Analyse de rentabilité
            </p>
            <h1 className="[overflow-wrap:anywhere] text-xl leading-snug font-semibold sm:text-2xl">
              {product.name}
            </h1>
            <Badge variant="secondary">
              {product.published ? "Publié" : "Brouillon"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="grid min-w-0 flex-1 gap-1 text-xs text-muted-foreground xl:flex-none">
            Mode de vente
            <select
              className="h-9 max-w-full rounded-md border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              value={modeCode}
              disabled={!modes.length}
              onChange={(event) => onModeChange(event.target.value)}
            >
              {modes.map((mode) => (
                <option key={mode.code} value={mode.code}>
                  {mode.label} · {mode.quantity} unité(s)
                </option>
              ))}
            </select>
          </label>
          {choices.length > 0 && !worstCase && (
            <label className="grid min-w-0 flex-1 gap-1 text-xs text-muted-foreground xl:flex-none">
              {product.choiceGroup?.label || "Composition au choix"}
              <select
                className="h-9 max-w-full rounded-md border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                value={choiceCode}
                onChange={(event) => onChoiceChange(event.target.value)}
              >
                {choices.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
      {worstCase && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs leading-relaxed">
          <span className="font-medium">Estimation conservatrice.</span>{" "}
          Évaluation au pire cas, basée sur la combinaison de choix la plus
          coûteuse pour ce mode de vente.
        </p>
      )}
      {product.productType === "INGREDIENT_CUSTOMIZATION" && (
        <p className="text-xs text-muted-foreground">
          Analyse avec les quantités d’ingrédients par défaut enregistrées.
        </p>
      )}
    </header>
  );
}
