import { ListSearchInput } from "@/shared/components/ListFilters";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { salesWorkspaceFilterOptions } from "../model/workspacePresentation";

export function SalesWorkspaceFilters({
  search,
  filter,
  onSearchChange,
  onFilterChange,
}: {
  search: string;
  filter: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
}) {
  return (
    <section
      aria-label="Recherche et filtres des dossiers"
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="w-full max-w-xl sm:flex-1">
        <ListSearchInput
          label="Rechercher un client ou une référence"
          value={search}
          maxLength={200}
          onChange={onSearchChange}
          placeholder="Rechercher un client ou une référence"
        />
      </div>

      <div aria-label="Filtrer les dossiers" className="flex shrink-0 gap-2">
        <Tabs value={filter} onValueChange={onFilterChange} className="w-auto">
          <TabsList className="h-9">
            {salesWorkspaceFilterOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
}
