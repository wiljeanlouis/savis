import { NoData } from "@/shared/components/NoData";
import { Spinner } from "@/shared/ui/spinner";
import { CatalogProductDialog } from "../components/CatalogProductDialog";
import { CatalogProductCard } from "../components/CatalogProductCard";
import { useCatalogProductManagement } from "../hooks/useCatalogProductManagement";

export function CatalogProductsPage() {
  const {
    products,
    categories,
    boms,
    analysis,
    isLoading,
    isSaving,
    isPublishing,
    saveProduct,
    deleteProduct,
    publishProduct,
    unpublishProduct,
    runAnalysis,
  } = useCatalogProductManagement();

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
          <CatalogProductDialog
            categories={categories}
            boms={boms}
            saving={isSaving}
            onSave={saveProduct}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : products.length === 0 ? (
        <NoData />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {products.map((product) => (
            <CatalogProductCard
              key={product.id}
              product={product}
              result={product.id ? analysis[product.id] : undefined}
              categories={categories}
              boms={boms}
              saving={isSaving}
              publishing={isPublishing}
              onAnalyze={() => runAnalysis(product)}
              onPublish={() => publishProduct(product)}
              onUnpublish={() => unpublishProduct(product)}
              onSave={saveProduct}
              onDelete={() => deleteProduct(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
