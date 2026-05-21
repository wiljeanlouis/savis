import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const ingredientSortOptions = [
  { value: "last_retrieved_at", label: "Dernier obtenu" },
  { value: "label", label: "Produit" },
  { value: "brand", label: "Marque" },
  { value: "price", label: "Prix" },
  { value: "package_size", label: "Format" },
  { value: "provider", label: "Provider" },
  { value: "search_term", label: "Recherche" },
  { value: "status", label: "Statut" },
  { value: "next_refresh_at", label: "Prochain refresh" },
];

interface IngredientListSortingProps {
  sortBy: string;
  handleSortByChange: (value: string) => void;
  toggleSortDirection: () => void;
  sortDirection: string;
}

export const IngredientListSorting = ({
  sortBy,
  handleSortByChange,
  toggleSortDirection,
  sortDirection,
}: IngredientListSortingProps) => {
  return (
    <>
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {ingredientSortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSortDirection}
        title={sortDirection === "asc" ? "Ascendant" : "Descendant"}
      >
        <HugeiconsIcon
          icon={sortDirection === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
          strokeWidth={2}
        />
        <span className="sr-only">
          {sortDirection === "asc" ? "Ascendant" : "Descendant"}
        </span>
      </Button>
    </>
  );
};
