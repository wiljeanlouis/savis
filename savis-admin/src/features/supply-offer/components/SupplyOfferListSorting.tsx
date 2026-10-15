import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SupplyOfferSortDirection, SupplyOfferSortField } from "../types";
import { supplyOfferSortFieldLabels } from "../types";

const sortOptions = Object.entries(supplyOfferSortFieldLabels) as Array<
  [SupplyOfferSortField, string]
>;

interface SupplyOfferListSortingProps {
  sortBy: SupplyOfferSortField;
  sortDirection: SupplyOfferSortDirection;
  onSortByChange: (value: SupplyOfferSortField) => void;
  onToggleSortDirection: () => void;
}

/** Uses the same criterion and direction controls as offer management. */
export function SupplyOfferListSorting({
  sortBy,
  sortDirection,
  onSortByChange,
  onToggleSortDirection,
}: SupplyOfferListSortingProps) {
  const directionLabel = sortDirection === "asc" ? "Ascendant" : "Descendant";

  return (
    <>
      <Label
        htmlFor="supply-offer-sort"
        className="whitespace-nowrap text-muted-foreground"
      >
        Trier par
      </Label>
      <Select
        value={sortBy}
        onValueChange={(value) => onSortByChange(value as SupplyOfferSortField)}
      >
        <SelectTrigger
          id="supply-offer-sort"
          className="w-44"
          aria-label="Trier les offres par"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {sortOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onToggleSortDirection}
        title={directionLabel}
      >
        <HugeiconsIcon
          icon={sortDirection === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
          strokeWidth={2}
        />
        <span className="sr-only">{directionLabel}</span>
      </Button>
    </>
  );
}
