import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/shared/ui/input";
import { type BomComponent } from "../types";
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
import { useSearchAvailableOffers } from "../hooks/useBomApi";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share } from "@hugeicons/core-free-icons";
import { listResources, getResource } from "../../resource/api/resourceApi";
import { resourceCategories } from "../../resource/types";

interface Props {
  value: BomComponent;
  onChange: (value: BomComponent) => void;
  onRemove: () => void;
}

export const BomComponentInput = ({ value, onChange, onRemove }: Props) => {
  const resourceListId = useId();
  const [resourceSearch, setResourceSearch] = useState(value.componentName);
  const [showResourceResults, setShowResourceResults] = useState(false);
  const resourceOptions = useQuery({
    queryKey: ["resources", "active", resourceSearch.trim()],
    queryFn: () => listResources(resourceSearch.trim(), 0, "ACTIVE"),
    enabled: showResourceResults && resourceSearch.trim().length >= 2,
  });
  const resourceDetails = useQuery({
    queryKey: ["resources", "by-id", value.resourceId],
    queryFn: () => getResource(value.resourceId!),
    enabled: Boolean(value.resourceId),
  });
  const selectedResource =
    resourceDetails.data ??
    resourceOptions.data?.content.find(
      (resource) => resource.id === value.resourceId,
    );
  const resourceDisplayName = selectedResource?.name ?? value.componentName;
  const unitChoices = [
    { value: "g", base: "mass", label: "g" },
    { value: "kg", base: "mass", label: "kg" },
    { value: "l", base: "volume", label: "L" },
    { value: "ml", base: "volume", label: "mL" },
    { value: "piece", base: "piece", label: "unité" },
    { value: "portion", base: "portion", label: "portion" },
  ];
  const referenceUnitBase = selectedResource?.referenceUnit
    ? unitChoices.find((unit) => unit.value === selectedResource.referenceUnit)
        ?.base
    : undefined;
  const compatibleUnitChoices = referenceUnitBase
    ? unitChoices.filter((unit) => unit.base === referenceUnitBase)
    : unitChoices;
  const { data: offers = [], isFetching } = useSearchAvailableOffers(
    value.resourceId,
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
        <Field className="col-span-2 relative">
          <Input
            placeholder="Rechercher une ressource"
            value={showResourceResults ? resourceSearch : resourceDisplayName}
            required
            role="combobox"
            aria-label="Ressource du composant"
            aria-autocomplete="list"
            aria-expanded={showResourceResults}
            aria-controls={resourceListId}
            onFocus={() => {
              setResourceSearch(resourceDisplayName);
              setShowResourceResults(true);
            }}
            onBlur={() =>
              window.setTimeout(() => setShowResourceResults(false), 150)
            }
            onChange={(e) => setResourceSearch(e.target.value)}
          />
          {showResourceResults && resourceSearch.trim().length >= 2 && (
            <div
              id={resourceListId}
              role="listbox"
              aria-label="Ressources actives"
              className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-auto rounded-md border bg-popover p-1 shadow-md"
            >
              {(resourceOptions.data?.content ?? []).map((resource) => (
                <button
                  key={resource.id}
                  type="button"
                  role="option"
                  aria-selected={resource.id === value.resourceId}
                  className="flex w-full flex-col items-start rounded-sm px-3 py-2 text-left hover:bg-accent"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange({
                      ...value,
                      resourceId: resource.id,
                      componentName: resource.name,
                      unit: resource.referenceUnit ?? value.unit,
                      selectedOfferId: null,
                    });
                    setResourceSearch(resource.name);
                    setShowResourceResults(false);
                  }}
                >
                  <span>{resource.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {resourceCategories[resource.category]}
                  </span>
                </button>
              ))}
              {resourceOptions.isFetching && (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Recherche…
                </p>
              )}
              {!resourceOptions.isFetching &&
                resourceOptions.data?.content.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    Aucune ressource active trouvée
                  </p>
                )}
            </div>
          )}
          {value.resourceId && resourceDetails.data?.status === "INACTIVE" && (
            <p className="text-xs text-amber-700" role="status">
              Ressource inactive, conservée pour cette composition historique.
            </p>
          )}
        </Field>

        <div className="flex items-center gap-2">
          <Field>
            <Input
              placeholder="Quantity"
              type="number"
              step="any"
              min="0"
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
              <SelectTrigger className="w-32" id="bom-form-unit-list-f59">
                <SelectValue placeholder="Unité" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {compatibleUnitChoices.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Button type="button" variant="destructive" onClick={onRemove}>
            X
          </Button>
        </div>
      </div>

      {value.componentName.trim().length >= 2 && (
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
