import { ListFilterPopover } from "@/shared/components/ListFilterPopover";
import {
  ListSearchInput,
  ListSelectFilter,
} from "@/shared/components/ListFilters";

export function BomComponentTaskFilters({
  search,
  status,
  type,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onClear,
}: {
  search: string;
  status: string;
  type: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <section
      aria-label="Filtres des tâches"
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <ListSearchInput
        label="Rechercher dans les tâches d’acquisition"
        placeholder="Rechercher dans les tâches d’acquisition"
        value={search}
        onChange={onSearchChange}
      />
      <ListFilterPopover
        label="Filtres des tâches d’acquisition"
        count={Number(status !== "ALL") + Number(type !== "ALL")}
        onClear={onClear}
      >
        <ListSelectFilter
          inPanel
          label="Statut des tâches"
          value={status}
          onChange={onStatusChange}
          options={[
            ["ALL", "Tous les statuts"],
            ["IN_PROGRESS", "En cours"],
            ["COMPLETED", "Terminée"],
            ["FAILED", "Échouée"],
          ]}
        />
        <ListSelectFilter
          inPanel
          label="Type de tâche"
          value={type}
          onChange={onTypeChange}
          options={[
            ["ALL", "Tous les types"],
            ["GET_OFFER", "Récupération"],
            ["GET_OFFERS", "Recherche"],
            ["REFRESH_OFFER", "Actualisation"],
          ]}
        />
      </ListFilterPopover>
    </section>
  );
}
