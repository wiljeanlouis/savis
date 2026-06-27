import type { Bom } from "@/features/bom/types";
import { useState } from "react";
import { DeleteAlert } from "@/shared/components/DeleteAlert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Separator } from "@/shared/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreVerticalCircle01Icon } from "@hugeicons/core-free-icons";
import type { CatalogProduct, ProductPricingAnalysis } from "../types";
import { productCategories } from "../types";
import { CatalogProductDialog } from "./CatalogProductDialog";

interface CatalogProductCardProps {
  product: CatalogProduct;
  result?: ProductPricingAnalysis;
  boms: Bom[];
  saving: boolean;
  publishing: boolean;
  onAnalyze: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onSave: (product: CatalogProduct) => void | Promise<void>;
  onDelete: () => void;
}

export function CatalogProductCard({
  product,
  result,
  boms,
  saving,
  publishing,
  onAnalyze,
  onPublish,
  onUnpublish,
  onSave,
  onDelete,
}: CatalogProductCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const category = productCategories.find(
    (item) => item.value === product.category,
  );
  const primaryMode = [...product.purchaseModes]
    .filter((mode) => mode.active)
    .sort(
      (left, right) =>
        left.displayOrder - right.displayOrder ||
        left.label.localeCompare(right.label) ||
        left.code.localeCompare(right.code),
    )[0];
  const bomName = (bomId: string | null) =>
    bomId ? (boms.find((bom) => bom.id === bomId)?.name ?? bomId) : "Aucun BOM";

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="grid min-h-24 grid-cols-[72px_1fr_auto] gap-3 border-b py-4">
        <img
          src={product.imageUrl}
          alt=""
          className="row-span-2 size-[72px] rounded-md object-cover"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="truncate text-base">{product.name}</CardTitle>
            <Badge variant={product.published ? "default" : "secondary"}>
              {product.published ? "Publié" : "Brouillon"}
            </Badge>
          </div>
          <CardDescription className="mt-1">
            {product.code} · {category?.label ?? "Sans catégorie"}
          </CardDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">
              {productTypeLabel(product.productType)}
            </Badge>
            {!product.available && (
              <Badge variant="secondary">Indisponible</Badge>
            )}
          </div>
        </div>
        <CardAction>
          <p className="text-right text-lg font-semibold tabular-nums">
            {primaryMode ? money(primaryMode.price.amount) : "-"}
          </p>
          <p className="text-right text-xs text-muted-foreground">
            {primaryMode?.label ?? "Aucun mode actif"}
          </p>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-5 py-4 md:grid-cols-2">
        <section>
          <h3 className="mb-2 font-medium">Modes d’achat</h3>
          {product.purchaseModes.length === 0 ? (
            <MutedValue value="Aucun mode d'achat" />
          ) : (
            <div className="space-y-2">
              {product.purchaseModes.map((mode) => (
                <div
                  key={mode.id ?? mode.code}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{mode.label}</p>
                    <p className="text-muted-foreground">
                      {mode.quantity} unité{mode.quantity > 1 ? "s" : ""} ·{" "}
                      {allocationLabel(mode.allocationType)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!mode.active && <Badge variant="secondary">Inactif</Badge>}
                    <span className="font-medium tabular-nums">
                      {money(mode.price.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-2 font-medium">Composition BOM</h3>
          <div className="space-y-2">
            {product.productBoms.map((productBom) => (
              <BomLine
                key={
                  productBom.id ??
                  `${productBom.bomId}-${productBom.displayOrder}`
                }
                label={`BOM commun · quantité ${productBom.quantity}`}
                value={bomName(productBom.bomId)}
              />
            ))}
            {product.choiceGroup?.options.map((option) => (
              <BomLine
                key={option.id ?? option.code}
                label={option.name}
                value={bomName(option.bomId)}
                inactive={!option.active}
              />
            ))}
            {product.ingredientOptions.map((option) => (
              <BomLine
                key={option.id ?? option.code}
                label={`${option.name} · extra ${money(option.extraPrice.amount)}`}
                value={bomName(option.bomId)}
                inactive={!option.active}
              />
            ))}
            {!product.productBoms.length &&
              !product.choiceGroup?.options.length &&
              !product.ingredientOptions.length && (
                <MutedValue value="Aucun BOM associé" />
              )}
          </div>
        </section>
      </CardContent>

      {result && (
        <>
          <Separator />
          <CardContent className="grid grid-cols-2 gap-x-5 gap-y-2 py-4 sm:grid-cols-4">
            <Metric
              label="Analyse"
              value={
                result.analysisType === "WORST_CASE"
                  ? "Pire cas"
                  : "Configuration"
              }
            />
            <Metric
              label="Coût unitaire"
              value={money(result.unitCost.amount)}
            />
            <Metric
              label="Marge"
              value={
                result.actualMarginRate == null
                  ? "Incomplète"
                  : `${(result.actualMarginRate * 100).toFixed(1)} %`
              }
            />
            <Metric
              label="Prix recommandé"
              value={money(result.recommendedPrice?.amount)}
              status={result.status}
            />
          </CardContent>
        </>
      )}

      <CardFooter className="justify-end gap-2 border-t py-3">
        <Button type="button" variant="outline" onClick={onAnalyze}>
          Analyser
        </Button>
        <Button
          type="button"
          variant="default"
          disabled={publishing}
          onClick={onPublish}
        >
          {product.published ? "Republier" : "Publier"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={saving}>
              <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
              Modifier
            </DropdownMenuItem>
            {product.published && (
              <DropdownMenuItem
                variant="destructive"
                disabled={publishing}
                onSelect={onUnpublish}
              >
                Retirer de SavouretPlus
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setIsDeleteOpen(true)}
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <CatalogProductDialog
          product={product}
          boms={boms}
          saving={saving}
          onSave={onSave}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          hideTrigger
        />
        <DeleteAlert
          item={product.name}
          onDelete={onDelete}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          hideTrigger
        />
      </CardFooter>
    </Card>
  );
}

function BomLine({
  label,
  value,
  inactive,
}: {
  label: string;
  value: string;
  inactive?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="min-w-0 truncate">{label}</span>
      <span className="flex max-w-[55%] items-center gap-2 text-right text-muted-foreground">
        <span className="truncate">{value}</span>
        {inactive && <Badge variant="secondary">Inactif</Badge>}
      </span>
    </div>
  );
}

function MutedValue({ value }: { value: string }) {
  return <p className="text-muted-foreground">{value}</p>;
}

function Metric({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: ProductPricingAnalysis["status"];
}) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="font-medium tabular-nums">{value}</p>
        {status && (
          <Badge
            variant={
              status === "GOOD"
                ? "default"
                : status === "LOSS"
                  ? "destructive"
                  : "secondary"
            }
          >
            {status}
          </Badge>
        )}
      </div>
    </div>
  );
}

function productTypeLabel(type: CatalogProduct["productType"]) {
  return {
    STANDARD: "Standard",
    SINGLE_CHOICE: "Choix unique",
    SINGLE_CHOICE_BUNDLE: "Formats composables",
    INGREDIENT_CUSTOMIZATION: "Ingrédients personnalisables",
  }[type];
}

function allocationLabel(
  type: CatalogProduct["purchaseModes"][number]["allocationType"],
) {
  return {
    NONE: "sans choix",
    SINGLE_CHOICE: "une saveur",
    CHOICE_ALLOCATION: "saveurs réparties",
  }[type];
}

function money(amount?: number | null) {
  return amount == null
    ? "—"
    : new Intl.NumberFormat("fr-CA", {
        style: "currency",
        currency: "CAD",
      }).format(amount);
}
