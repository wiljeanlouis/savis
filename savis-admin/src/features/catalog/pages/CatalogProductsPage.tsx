import { useRef } from "react";
import { DetailSheet } from "@/shared/components/DetailSheet";
import { Link } from "react-router";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageSelector } from "@/shared/components/PageSelector";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { CatalogProductDataTable } from "../components/CatalogProductDataTable";
import { CatalogProductDetails } from "../components/CatalogProductDetails";
import { CatalogProductListFilters } from "../components/CatalogProductListFilters";
import { useCatalogProductManagement } from "../hooks/useCatalogProductManagement";
import { useCatalogProductList } from "../hooks/useCatalogProductList";

export function CatalogProductsPage() {
  const management = useCatalogProductManagement();
  const list = useCatalogProductList(
    management.products,
    !management.isLoading && !management.isError,
  );
  const listRef = useRef<HTMLDivElement>(null);
  return (
    <div className="min-w-0 space-y-6 dark:[--primary:#e078a4] dark:[--primary-foreground:#24131a]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Produits</h1>
          <p className="text-sm text-muted-foreground">
            Consultez vos produits, leurs modes de vente et leurs compositions.
          </p>
        </div>
        <Button asChild>
          <Link to="/catalog-products/new">Nouveau produit</Link>
        </Button>
      </header>
      <CatalogProductListFilters
        params={list.params}
        update={list.update}
        reset={list.resetFilters}
      />
      {management.isLoading ? (
        <div
          role="status"
          className="flex min-h-64 items-center justify-center gap-2"
        >
          <Spinner />
          Chargement des produits…
        </div>
      ) : management.isError ? (
        <ApiErrorAlert
          title="Impossible de charger les produits."
          error={management.error}
        />
      ) : (
        <div className="space-y-3">
          <div ref={listRef} className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PageItemCount
                itemName="produit"
                totalItems={
                  management.isLoading || management.isError
                    ? undefined
                    : list.totalItems
                }
              />
              <div className="flex items-center gap-2">
                <PageSelector
                  pageSize={list.pageSize}
                  onPageChange={(size) => list.update("size", String(size))}
                />
              </div>
            </div>
            {list.items.length ? (
              <CatalogProductDataTable
                products={list.items}
                selectedId={list.selected?.id}
                onSelect={list.select}
                params={list.params}
                onSort={(value) => list.update("sort", value)}
              />
            ) : (
              <div
                role="status"
                className="border-y border-dashed py-8 text-center text-sm text-muted-foreground"
              >
                {management.products.length
                  ? "Aucun produit ne correspond aux filtres sélectionnés."
                  : "Aucun produit dans le catalogue."}
              </div>
            )}
            <PageNavigator
              page={list.page}
              totalPages={list.totalPages}
              goToPreviousPage={() => list.changePage(list.page - 1)}
              goToNextPage={() => list.changePage(list.page + 1)}
            />
          </div>
          <DetailSheet
            open={!!list.selected}
            onClose={list.showList}
            title="Détail du produit"
            listRef={listRef}
          >
            {list.selected && (
              <CatalogProductDetails
                key={list.selected.id}
                product={list.selected}
                boms={management.boms}
                publishing={management.isPublishing}
                onPublish={() => management.publishProduct(list.selected!)}
                onUnpublish={() => management.unpublishProduct(list.selected!)}
                onDelete={() => management.deleteProduct(list.selected!.id)}
              />
            )}
          </DetailSheet>
        </div>
      )}
    </div>
  );
}
