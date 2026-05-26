import { Input } from "@/shared/ui/input";
import { type RecipeIngredient } from "../types";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/shared/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { useSearchAvailableOffers } from "../hooks/useRecipeApi";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share } from "@hugeicons/core-free-icons";

interface Props {
  value: RecipeIngredient;
  onChange: (value: RecipeIngredient) => void;
  onRemove: () => void;
}

export const IngredientInput = ({ value, onChange, onRemove }: Props) => {
  const { data: offers = [], isFetching } = useSearchAvailableOffers(
    value.ingredientName,
  );

  const selectedOffer = offers.find(
    (offer) => offer.id === value.selectedOfferId,
  );

  const offerName = (offer: (typeof offers)[number]) =>
    [offer.brand, offer.label].filter(Boolean).join(" ") || offer.componentName;

  const offerMeta = (offer: (typeof offers)[number]) => {
    const parts = [
      offer.price ? `${offer.price.amount} ${offer.price.currency}` : null,
      offer.packageSize
        ? `${offer.packageSize.value} ${offer.packageSize.unit}`
        : null,
      offer.provider?.name,
    ].filter(Boolean);

    return parts.join(" / ");
  };

  const productUrl = (offer: (typeof offers)[number]) => {
    if (!offer.url) {
      return null;
    }

    return offer.url;
  };

  const selectedProductUrl = selectedOffer ? productUrl(selectedOffer) : null;
  const hasOffers = offers.length > 0;
  const offerPlaceholder = isFetching
    ? "Recherche des offres..."
    : hasOffers
      ? "Choisir une offre disponible"
      : "Aucune offre disponible";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4 items-start my-1">
        <Field className="col-span-2">
          <Input
            placeholder="Ingredient Name"
            value={value.ingredientName}
            required
            onChange={(e) =>
              onChange({
                ...value,
                ingredientName: e.target.value,
                selectedOfferId: null,
              })
            }
          />
        </Field>

        <div className="flex items-center gap-2">
          <Field>
            <Input
              placeholder="Quantity"
              value={value.quantity}
              required
              onChange={(e) =>
                onChange({ ...value, quantity: Number(e.target.value) })
              }
            />
          </Field>
          <Field>
            <Select
              value={value.unit}
              onValueChange={(e) => onChange({ ...value, unit: e })}
            >
              <SelectTrigger className="w-32" id="recipe-form-unit-list-f59">
                <SelectValue placeholder="Unité" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem key="grams" value="g">
                    g
                  </SelectItem>
                  <SelectItem key="kilograms" value="kg">
                    kg
                  </SelectItem>
                  <SelectItem key="liters" value="l">
                    L
                  </SelectItem>
                  <SelectItem key="milliliters" value="ml">
                    mL
                  </SelectItem>
                  <SelectItem key="piece" value="piece">
                    pièce
                  </SelectItem>
                  <SelectItem key="portion" value="portion">
                    portion
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Button type="button" variant="destructive" onClick={onRemove}>
            X
          </Button>
        </div>
      </div>

      {value.ingredientName.trim().length >= 2 && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={!isFetching && !hasOffers}
                className="h-14 w-full min-w-0 justify-start px-2"
              >
                {selectedOffer ? (
                  <span className="grid min-w-0 grid-cols-[2.5rem_1fr] items-center gap-2">
                    {selectedOffer.imageUrl ? (
                      <img
                        src={selectedOffer.imageUrl}
                        alt={selectedOffer.label ?? selectedOffer.componentName}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <span className="h-10 w-10 rounded-md bg-muted" />
                    )}
                    <span className="flex min-w-0 flex-col items-start">
                      <span className="truncate font-medium">
                        {offerName(selectedOffer)}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {offerMeta(selectedOffer)}
                      </span>
                    </span>
                  </span>
                ) : (
                  <span className="truncate text-muted-foreground">
                    {offerPlaceholder}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-80 p-1">
              {offers.map((offer) => (
                <DropdownMenuItem
                  key={offer.id}
                  className="min-h-16 items-center gap-3 p-2"
                  onSelect={() =>
                    onChange({ ...value, selectedOfferId: offer.id })
                  }
                >
                  {offer.imageUrl ? (
                    <img
                      src={offer.imageUrl}
                      alt={offer.label ?? offer.componentName}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  ) : (
                    <span className="h-12 w-12 rounded-md bg-muted" />
                  )}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      {offerName(offer)}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {offerMeta(offer)}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedProductUrl && (
            <a
              href={selectedProductUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              <HugeiconsIcon icon={Share} size={20} strokeWidth={1} />
            </a>
          )}
        </div>
      )}
    </div>
  );
};
