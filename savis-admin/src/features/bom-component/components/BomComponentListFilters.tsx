import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { BomComponentSearchTermFacets } from "./BomComponentSearchTermFacets";
import type { useBomComponentList } from "../hooks/useBomComponentList";
import type { BomComponentStatus } from "../types";

export function BomComponentListFilters({
  list,
}: {
  list: ReturnType<typeof useBomComponentList>;
}) {
  const { listState } = list;
  return (
    <section
      aria-label="Filtres des offres à valider"
      className="flex flex-wrap items-center gap-3"
    >
      <Select
        value={listState.status}
        onValueChange={(status) =>
          list.handleStatusChange(status as BomComponentStatus | "ALL")
        }
      >
        <SelectTrigger className="h-9 w-44" aria-label="Statut de validation">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NEW">À valider</SelectItem>
          <SelectItem value="VALID">Validées</SelectItem>
          <SelectItem value="REJECTED">Rejetées</SelectItem>
          <SelectItem value="ALL">Tous les statuts</SelectItem>
        </SelectContent>
      </Select>
      <BomComponentSearchTermFacets
        status={listState.status === "ALL" ? undefined : listState.status}
        selectedSearchTerm={listState.searchTerm}
        onSearchTermChange={list.handleSearchTermChange}
      />
    </section>
  );
}
