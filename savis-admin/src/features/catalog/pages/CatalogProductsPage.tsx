import { NoData } from "@/shared/components/NoData";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { CatalogProductCard } from "../components/CatalogProductCard";
import { useCatalogProductManagement } from "../hooks/useCatalogProductManagement";
import { Link } from "react-router";

export function CatalogProductsPage() {
  const {
    products,
    boms,
    analysis,
    isLoading,
    isError,
    error,
    isPublishing,
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
        <Button asChild>
          <Link to="/catalog-products/new">Ajouter un produit</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : isError ? (
        <ApiErrorAlert
          title="Impossible de charger les produits."
          error={error}
        />
      ) : products.length === 0 ? (
        <NoData />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {products.map((product) => (
            <CatalogProductCard
              key={product.id}
              product={product}
              result={product.id ? analysis[product.id] : undefined}
              boms={boms}
              publishing={isPublishing}
              onAnalyze={() => runAnalysis(product)}
              onPublish={() => publishProduct(product)}
              onUnpublish={() => unpublishProduct(product)}
              onDelete={() => deleteProduct(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
