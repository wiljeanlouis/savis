import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageSelector } from "@/shared/components/PageSelector";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { CatalogProductCompactList } from "../components/CatalogProductCompactList";
import { CatalogProductDetails } from "../components/CatalogProductDetails";
import { CatalogProductListFilters } from "../components/CatalogProductListFilters";
import { useCatalogProductManagement } from "../hooks/useCatalogProductManagement";
import { useCatalogProductList } from "../hooks/useCatalogProductList";

export function CatalogProductsPage() {
  const management = useCatalogProductManagement();
  const list = useCatalogProductList(management.products);
  const detailRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (list.mobileDetail && window.matchMedia?.("(max-width: 1023px)").matches)
      detailRef.current?.focus();
  }, [list.mobileDetail, list.selected?.id]);
  const backToList = () => {
    list.showList();
    requestAnimationFrame(() =>
      listRef.current
        ?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
        ?.focus(),
    );
  };
  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produits</h1>
          <p className="text-sm text-muted-foreground">
            Consultez vos produits, leurs modes de vente et leurs compositions.
          </p>
        </div>
        <Button asChild>
          <Link to="/catalog-products/new">Ajouter un produit</Link>
        </Button>
      </header>
      <CatalogProductListFilters params={list.params} update={list.update} />
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
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div
            ref={listRef}
            className={
              list.mobileDetail && list.selected
                ? "hidden min-w-0 space-y-3 lg:block"
                : "min-w-0 space-y-3"
            }
          >
            <div className="flex items-center justify-end gap-2">
              <PageSelector
                pageSize={list.pageSize}
                onPageChange={(size) => list.update("size", String(size))}
              />
            </div>
            {list.items.length ? (
              <CatalogProductCompactList
                products={list.items}
                selectedId={list.selected?.id}
                onSelect={list.select}
              />
            ) : (
              <div
                role="status"
                className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground"
              >
                {management.products.length
                  ? "Aucun produit ne correspond aux filtres sélectionnés."
                  : "Aucun produit dans le catalogue."}
              </div>
            )}
            <PageNavigator
              itemName="produit"
              totalItems={list.totalItems}
              page={list.page}
              totalPages={list.totalPages}
              goToPreviousPage={() => list.changePage(list.page - 1)}
              goToNextPage={() => list.changePage(list.page + 1)}
            />
          </div>
          <div
            ref={detailRef}
            tabIndex={-1}
            className={`${list.mobileDetail && list.selected ? "fixed inset-0 z-40 flex" : "hidden"} min-h-0 min-w-0 flex-col gap-2 bg-background p-3 outline-none lg:sticky lg:inset-auto lg:top-4 lg:z-auto lg:flex lg:bg-transparent lg:p-0`}
          >
            {list.selected ? (
              <>
                <Button
                  variant="outline"
                  className="shrink-0 self-start lg:hidden"
                  onClick={backToList}
                >
                  Retour à la liste
                </Button>
                <CatalogProductDetails
                  key={list.selected.id}
                  product={list.selected}
                  boms={management.boms}
                  publishing={management.isPublishing}
                  onPublish={() => management.publishProduct(list.selected!)}
                  onUnpublish={() =>
                    management.unpublishProduct(list.selected!)
                  }
                  onDelete={() => management.deleteProduct(list.selected!.id)}
                />
              </>
            ) : (
              <section
                aria-label="Détail du produit"
                className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground"
              >
                Aucun produit à consulter.
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
