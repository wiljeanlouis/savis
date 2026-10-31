import { ListFilterPopover } from "@/shared/components/ListFilterPopover";
import {
  ListSearchInput,
  ListSelectFilter,
} from "@/shared/components/ListFilters";
import type { SupplyOfferStatusFilter } from "../types";
export function SupplyOfferListFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status: SupplyOfferStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: SupplyOfferStatusFilter) => void;
}) {
  return (
    <section
      aria-label="Filtres des offres"
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <ListSearchInput
        label="Rechercher dans les offres fournisseurs"
        placeholder="Rechercher dans les offres fournisseurs"
        value={search}
        onChange={onSearchChange}
      />
      <ListFilterPopover
        label="Filtres des offres fournisseurs"
        count={status === "ALL" ? 0 : 1}
        onClear={() => onStatusChange("ALL")}
      >
        <ListSelectFilter
          inPanel
          label="Disponibilité"
          value={status}
          onChange={(value) => onStatusChange(value as SupplyOfferStatusFilter)}
          options={[
            ["ALL", "Toutes"],
            ["AVAILABLE", "Disponibles"],
            ["UNAVAILABLE", "Indisponibles"],
          ]}
        />
      </ListFilterPopover>
    </section>
  );
}
