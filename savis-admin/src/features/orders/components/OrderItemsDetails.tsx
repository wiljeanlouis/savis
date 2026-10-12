import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type React from "react";
import type { OrderItem } from "../types";
import { formatOrderCurrency } from "../types";
import { OrderProductImage } from "./OrderProductImage";

export function OrderItemsDetails({ items }: { items: OrderItem[] }) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <OrderProductImage
                  imageUrl={item.imageUrl}
                  productName={item.productNameSnapshot}
                  className="size-20"
                />
                <div className="min-w-0">
                  <CardTitle>{item.productNameSnapshot}</CardTitle>
                  {item.purchaseModeLabel ? (
                    <p className="mt-1 text-muted-foreground">
                      Format : {item.purchaseModeLabel}
                      {item.purchaseModeQuantity
                        ? ` (${item.purchaseModeQuantity} unités)`
                        : ""}
                    </p>
                  ) : null}
                </div>
              </div>
              <Badge variant="outline">Qté {item.quantity}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              {item.choiceSelections.map((selection) => (
                <DetailGroup
                  key={selection.choiceId}
                  title={selection.groupLabel}
                >
                  {selection.choiceName}
                </DetailGroup>
              ))}

              {item.choiceAllocations.length > 0 ? (
                <DetailGroup title="Répartition des saveurs">
                  <ul className="flex flex-wrap gap-2">
                    {item.choiceAllocations.map((allocation) => (
                      <li key={allocation.choiceId}>
                        <Badge variant="secondary">
                          {allocation.choiceName} × {allocation.quantity}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </DetailGroup>
              ) : null}

              {item.ingredientSelections.length > 0 ? (
                <DetailGroup title="Ingrédients et extras">
                  <ul className="grid gap-1">
                    {item.ingredientSelections.map((ingredient) => {
                      const extras = Math.max(
                        0,
                        ingredient.quantity - ingredient.defaultQuantity,
                      );
                      return (
                        <li key={ingredient.ingredientId}>
                          {ingredient.ingredientName} : {ingredient.quantity}
                          {extras > 0
                            ? ` (${extras} extra × ${formatOrderCurrency(ingredient.extraPriceCents)})`
                            : ""}
                        </li>
                      );
                    })}
                  </ul>
                </DetailGroup>
              ) : null}
            </div>

            <dl className="grid min-w-48 content-start gap-2 text-right">
              <div>
                <dt className="text-muted-foreground">Prix unitaire</dt>
                <dd className="font-semibold">
                  {formatOrderCurrency(item.unitPriceCents)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total ligne</dt>
                <dd className="text-base font-semibold">
                  {formatOrderCurrency(item.lineTotalCents)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DetailGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 font-semibold">{title}</p>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}
