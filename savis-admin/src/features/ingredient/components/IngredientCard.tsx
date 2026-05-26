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
import type {
  Ingredient,
  IngredientEditValues,
  IngredientStatus,
} from "../types";
import { IngredientEditDialog } from "./IngredientEditDialog";

const statusVariant: Record<
  IngredientStatus,
  "default" | "secondary" | "destructive"
> = {
  NEW: "secondary",
  VALID: "default",
  REJECTED: "destructive",
};

const formatPrice = (amount: string, currency: string) => {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(Number(amount));
};

const formatPackageSize = (value: number, unit: string) => {
  return `${value} ${unit}`;
};

interface IngredientCardProps {
  ingredient: Ingredient;
  isPatching: boolean;
  onPatch: (ingredient: Ingredient, status: IngredientStatus) => void;
  onEdit: (ingredient: Ingredient, values: IngredientEditValues) => void;
}

export const IngredientCard = ({
  ingredient,
  isPatching,
  onPatch,
  onEdit,
}: IngredientCardProps) => {
  const price = ingredient.price
    ? formatPrice(ingredient.price.amount, ingredient.price.currency)
    : "-";
  const packageSize = ingredient.package_size
    ? formatPackageSize(
        ingredient.package_size.value,
        ingredient.package_size.unit,
      )
    : "-";

  return (
    <Card className="h-full">
      <div className="flex justify-center bg-muted p-4">
        <img
          src={ingredient.image_url}
          alt={ingredient.label}
          className="size-40 object-contain"
          loading="lazy"
        />
      </div>
      <CardHeader>
        <CardTitle>
          <a
            href={ingredient.url}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-2 hover:underline"
          >
            {ingredient.label}
          </a>
        </CardTitle>
        <CardDescription className="line-clamp-1">
          {ingredient.brand || "-"}
        </CardDescription>
        <CardAction>
          <Badge variant={statusVariant[ingredient.status]}>
            {ingredient.status}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div>
          <div className="text-lg font-semibold">{price}</div>
          <div className="text-muted-foreground">{packageSize}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-muted-foreground">
          <div>
            <div className="text-[0.625rem] uppercase">Provider</div>
            <div className="truncate text-foreground">
              {ingredient.provider.name}
            </div>
          </div>
          <div>
            <div className="text-[0.625rem] uppercase">Recherche</div>
            <div className="truncate text-foreground">
              {ingredient.search_term || "-"}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex gap-2">
        {ingredient.status !== "VALID" ? (
          <Button
            className="flex-1"
            disabled={isPatching}
            onClick={() => onPatch(ingredient, "VALID")}
          >
            Valider
          </Button>
        ) : null}
        {ingredient.status === "VALID" ? (
          <Button
            className="flex-1"
            variant="destructive"
            disabled={isPatching}
            onClick={() => onPatch(ingredient, "REJECTED")}
          >
            Invalider
          </Button>
        ) : (
          <Button
            className="flex-1"
            variant="outline"
            disabled={isPatching || ingredient.status === "REJECTED"}
            onClick={() => onPatch(ingredient, "REJECTED")}
          >
            Rejeter
          </Button>
        )}
        <IngredientEditDialog
          ingredient={ingredient}
          isPatching={isPatching}
          onEdit={onEdit}
        />
      </CardFooter>
    </Card>
  );
};
