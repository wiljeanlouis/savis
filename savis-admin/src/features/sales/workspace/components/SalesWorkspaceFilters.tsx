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

      <div
        aria-label="Filtrer les dossiers"
        className="w-full shrink-0 sm:w-auto"
      >
        <Tabs value={filter} onValueChange={onFilterChange} className="w-auto">
          <TabsList className="grid h-9 w-full grid-cols-3 sm:w-auto sm:grid-flow-col sm:auto-cols-max sm:grid-cols-none">
            {salesWorkspaceFilterOptions.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="px-3"
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
}
