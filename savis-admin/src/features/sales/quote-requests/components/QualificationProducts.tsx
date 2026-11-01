import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import type { useQuotationEditor } from "../../quotations/hooks/useQuotationEditor";
import { OrderItemEditor } from "../../orders/components/OrderEditorForm";
import { CatalogProductDropdown } from "../../orders/components/CatalogProductDropdown";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
export function QualificationProducts({
  editor,
}: {
  editor: ReturnType<typeof useQuotationEditor>;
}) {
  const commercial = editor.draft.commercial;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Coordonnées du client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="qualified-name">Nom du client</Label>
            <Input
              id="qualified-name"
              required
              maxLength={200}
              autoComplete="name"
              value={commercial.customerName}
              onChange={(e) =>
                editor.setCommercial({
                  ...commercial,
                  customerName: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qualified-phone">Téléphone</Label>
            <Input
              id="qualified-phone"
              required
              maxLength={50}
              autoComplete="tel"
              value={commercial.customerPhone}
              onChange={(e) =>
                editor.setCommercial({
                  ...commercial,
                  customerPhone: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qualified-email">Courriel</Label>
            <Input
              id="qualified-email"
              maxLength={254}
              autoComplete="email"
              type="email"
              value={commercial.customerEmail}
              onChange={(e) =>
                editor.setCommercial({
                  ...commercial,
                  customerEmail: e.target.value,
                })
              }
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Produits retenus</CardTitle>
            <CatalogProductDropdown
              products={editor.searchResults}
              search={editor.productSearch}
              isLoading={editor.isSearchingProducts}
              isError={editor.isProductSearchError}
              onSearchChange={editor.setProductSearch}
              onSelect={editor.addProduct}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {commercial.items.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              Aucun produit retenu. Ajoutez un produit du catalogue pour
              préparer un devis.
            </div>
          )}
          {commercial.items.map((item) => {
            const product = editor.products.find(
              (p) => p.id === item.productId,
            );
            return (
              <div key={item.key}>
                {product && !product.available && (
                  <p
                    role="alert"
                    className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive"
                  >
                    Le produit {product.name} est devenu indisponible.
                    Remplacez-le ou motivez l’exclusion du besoin.
                  </p>
                )}
                {product ? (
                  <OrderItemEditor
                    item={item}
                    product={product}
                    onChange={(patch) => editor.patchItem(item.key, patch)}
                    onRemove={() => editor.removeItem(item.key)}
                  />
                ) : (
                  <p>
                    Produit indisponible ou en cours de chargement.{" "}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => editor.removeItem(item.key)}
                    >
                      Retirer cette ligne
                    </Button>
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
