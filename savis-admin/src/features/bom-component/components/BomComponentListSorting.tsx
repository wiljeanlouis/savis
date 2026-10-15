import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const bomComponentSortOptions = [
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

interface BomComponentListSortingProps {
  sortBy: string;
  handleSortByChange: (value: string) => void;
  toggleSortDirection: () => void;
  sortDirection: string;
}

export const BomComponentListSorting = ({
  sortBy,
  handleSortByChange,
  toggleSortDirection,
  sortDirection,
}: BomComponentListSortingProps) => {
  return (
    <>
      <Label
        htmlFor="bom-component-sort"
        className="whitespace-nowrap text-muted-foreground"
      >
        Trier par
      </Label>
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger
          id="bom-component-sort"
          className="w-44"
          aria-label="Trier les offres par"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {bomComponentSortOptions.map((option) => (
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
