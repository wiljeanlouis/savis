import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Spinner } from "@/shared/ui/spinner";
import { useCatalogProductsByIds } from "@/features/catalog/hooks/useCatalogApi";
/** Check current availability without altering the originally requested configurations. */
export function RequestedProductAvailability({ payload }: { payload: string }) {
  let items: { offering_id: string; name: string }[] = [];
  try {
    items = (JSON.parse(payload) as { items: typeof items }).items ?? [];
  } catch {
    /* Original remains readable. */
  }
  const products = useCatalogProductsByIds(
    items.map((item) => item.offering_id),
  );
  if (!items.length) return null;
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Disponibilité actuelle des articles demandés</CardTitle>
      </CardHeader>
      <CardContent>
        {products.isPending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Spinner />
            Vérification du catalogue…
          </div>
        ) : (
          <ul className="divide-y">
            {Array.from(
              new Map(items.map((item) => [item.offering_id, item])).values(),
            ).map((item) => {
              const current = products.data.find(
                (product) => product.id === item.offering_id,
              );
              return (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                  key={item.offering_id}
                >
                  <span className="font-medium">{item.name}</span>
                  <Badge variant={current?.available ? "secondary" : "outline"}>
                    {current
                      ? current.available
                        ? "Disponible"
                        : "Devenu indisponible"
                      : "Introuvable ou inaccessible — vérification requise"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
