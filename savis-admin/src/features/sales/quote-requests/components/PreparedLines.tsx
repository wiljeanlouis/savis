import { useCatalogProductsByIds } from "@/features/catalog/hooks/useCatalogApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { effectiveQualification, type QuoteRequest } from "../model/types";
import { needLabel, parseOriginalRequest } from "../model/originalRequest";

/** Presents current operator selections; validation and pricing stay on the server. */
export function PreparedLines({ request }: { request: QuoteRequest }) {
  const lines = effectiveQualification(request)?.lines ?? [];
  const products = useCatalogProductsByIds(
    lines.map((line) => line.productId),
    lines.length > 0,
  );
  const original = parseOriginalRequest(request.originalPayload);
  if (!lines.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lignes commerciales préparées</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lines.map((line) => {
          const product = products.data?.find((p) => p.id === line.productId);
          const mode = product?.purchaseModes.find(
            (m) => m.code === line.purchaseModeCode,
          );
          const choiceName = (code: string) =>
            product?.choiceGroup?.options.find((c) => c.code === code)?.name ??
            code;
          return (
            <div className="space-y-1 rounded-lg border p-4" key={line.id}>
              <p className="font-medium">
                {product?.name ?? "Produit Catalog à vérifier"}
              </p>
              <p>
                Quantité : {line.quantity} · Mode de vente :{" "}
                {mode?.label ?? line.purchaseModeCode ?? "Par défaut"}
              </p>
              {line.choiceCode && <p>{choiceName(line.choiceCode)}</p>}
              {line.allocations.map((a) => (
                <p key={a.choiceCode}>
                  {choiceName(a.choiceCode)} × {a.quantity}
                </p>
              ))}
              {line.ingredients.map((i) => (
                <p key={i.ingredientCode}>
                  {product?.ingredientOptions.find(
                    (o) => o.code === i.ingredientCode,
                  )?.name ?? i.ingredientCode}{" "}
                  × {i.quantity}
                </p>
              ))}
              <p className="text-sm text-muted-foreground">
                {line.needKeys
                  .map((key) => needLabel(key, original))
                  .join(", ")}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
