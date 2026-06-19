import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useGetBoms } from "@/features/bom/hooks/useBomApi";
import type { Bom } from "@/features/bom/types";
import { DeleteAlert } from "@/shared/components/DeleteAlert";
import { NoData } from "@/shared/components/NoData";
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
import { Separator } from "@/shared/ui/separator";
import { Spinner } from "@/shared/ui/spinner";
import { CatalogProductDialog } from "../components/CatalogProductDialog";
import {
  useAnalyzeProductPricing,
  useAnalyzeWorstCasePricing,
  useCatalogProducts,
  useDeleteCatalogProduct,
  useProductCategories,
  usePublishCatalog,
  useSaveCatalogProduct,
} from "../hooks/useCatalogApi";
import type {
  CatalogProduct,
  ProductCategory,
  ProductPricingAnalysis,
} from "../types";

const money = (amount?: number | null) =>
  amount == null
    ? "—"
    : new Intl.NumberFormat("fr-CA", {
        style: "currency",
        currency: "CAD",
      }).format(amount);

export function CatalogProductsPage() {
  const productsQuery = useCatalogProducts();
  const categoriesQuery = useProductCategories();
  const bomsQuery = useGetBoms();
  const saveProduct = useSaveCatalogProduct();
  const deleteProduct = useDeleteCatalogProduct();
  const publishCatalog = usePublishCatalog();
  const analyze = useAnalyzeProductPricing();
  const analyzeWorstCase = useAnalyzeWorstCasePricing();

  const [analysis, setAnalysis] = useState<
    Record<string, ProductPricingAnalysis>
  >({});

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const boms = bomsQuery.data ?? [];

  const save = (product: CatalogProduct) =>
    saveProduct.mutate(product, {
      onSuccess: () => toast.success("Produit sauvegardé."),
      onError: () => toast.error("Impossible de sauvegarder le produit."),
    });

  const runAnalysis = (product: CatalogProduct) => {
    if (!product.id) return;
    const bundleMode = product.purchaseModes.find(
      (mode) => mode.active && mode.allocationType === "CHOICE_ALLOCATION",
    );
    const mutation = bundleMode ? analyzeWorstCase : analyze;
    const variables = bundleMode
      ? { productId: product.id, purchaseModeCode: bundleMode.code }
      : {
          productId: product.id,
          configuration: {
            purchaseModeCode:
              product.purchaseModes.find((mode) => mode.active)?.code ?? null,
            choiceCode:
              product.choiceGroup?.options.find((option) => option.active)
                ?.code ?? null,
            allocations: [],
            ingredients: product.ingredientOptions
              .filter((option) => option.active)
              .map((option) => ({
                ingredientCode: option.code,
                quantity: option.defaultQuantity,
              })),
          },
        };
    mutation.mutate(variables as never, {
      onSuccess: (result) =>
        setAnalysis((current) => ({ ...current, [product.id!]: result })),
      onError: () => toast.error("L’analyse de rentabilité a échoué."),
    });
  };

  if (
    productsQuery.isPending ||
    categoriesQuery.isPending ||
    bomsQuery.isPending
  ) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produits</h1>
          <p className="text-sm text-muted-foreground">
            Prix, configurations et analyse de rentabilité.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={publishCatalog.isPending}
            onClick={() =>
              publishCatalog.mutate(undefined, {
                onSuccess: ({ publishedProductCount }) =>
                  publishedProductCount === 0
                    ? toast.info("Aucun produit marqué « Publier » à envoyer.")
                    : toast.success(
                        `${publishedProductCount} produit${publishedProductCount > 1 ? "s" : ""} publié${publishedProductCount > 1 ? "s" : ""} vers Supabase.`,
                      ),
                onError: (error) => toast.error(publicationErrorMessage(error)),
              })
            }
          >
            Publier
          </Button>
          <CatalogProductDialog
            categories={categories}
            boms={boms}
            saving={saveProduct.isPending}
            onSave={save}
          />
        </div>
      </div>

      {products.length === 0 ? (
        <NoData />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              result={product.id ? analysis[product.id] : undefined}
              categories={categories}
              boms={boms}
              saving={saveProduct.isPending}
              onAnalyze={() => runAnalysis(product)}
              onSave={save}
              onDelete={() => product.id && deleteProduct.mutate(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  result,
  categories,
  boms,
  saving,
  onAnalyze,
  onSave,
  onDelete,
}: {
  product: CatalogProduct;
  result?: ProductPricingAnalysis;
  categories: ProductCategory[];
  boms: Bom[];
  saving: boolean;
  onAnalyze: () => void;
  onSave: (product: CatalogProduct) => void;
  onDelete: () => void;
}) {
  const category = categories.find((item) => item.id === product.categoryId);
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
            {product.code} · {category?.name ?? "Sans catégorie"}
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
            {money(product.basePrice.amount)}
          </p>
          <p className="text-right text-xs text-muted-foreground">
            {product.unitLabel}
          </p>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-5 py-4 md:grid-cols-2">
        <section>
          <h3 className="mb-2 font-medium">Modes d’achat</h3>
          {product.purchaseModes.length === 0 ? (
            <MutedValue value="Prix de base uniquement" />
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
        <CatalogProductDialog
          product={product}
          categories={categories}
          boms={boms}
          saving={saving}
          onSave={onSave}
        />
        <DeleteAlert item={product.name} onDelete={onDelete} />
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

function publicationErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return (
      error.response?.data?.detail ?? "La publication vers Supabase a échoué."
    );
  }
  return "La publication vers Supabase a échoué.";
}
