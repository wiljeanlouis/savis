import {
  ListSearchInput,
  ListSelectFilter,
} from "@/shared/components/ListFilters";
import { ListFilterPopover } from "@/shared/components/ListFilterPopover";
import {
  resourceCategories,
  type ResourceCategory,
  type MaterialResource,
} from "../types";
export function ResourceListFilters({
  search,
  status,
  category,
  onCategoryChange,
  onClear,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status?: MaterialResource["status"];
  category?: ResourceCategory;
  onCategoryChange: (value: string) => void;
  onClear: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}) {
  return (
    <section
      aria-label="Filtres des ressources"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <ListSearchInput
        label="Rechercher les ressources"
        placeholder="Rechercher par nom ou description"
        maxLength={160}
        value={search}
        onChange={onSearchChange}
      />
      <ListFilterPopover
        label="Filtres des ressources"
        count={Number(!!status) + Number(!!category)}
        onClear={onClear}
      >
        <ListSelectFilter
          inPanel
          label="Filtrer par statut"
          value={status ?? "ALL"}
          onChange={(value) => onStatusChange(value === "ALL" ? "" : value)}
          options={[
            ["ALL", "Toutes"],
            ["ACTIVE", "Actives"],
            ["INACTIVE", "Inactives"],
          ]}
        />
        <ListSelectFilter
          inPanel
          label="Catégorie"
          value={category ?? "ALL"}
          onChange={(value) => onCategoryChange(value === "ALL" ? "" : value)}
          options={[
            ["ALL", "Toutes les catégories"],
            ...Object.entries(resourceCategories),
          ]}
        />
      </ListFilterPopover>
    </section>
  );
}
