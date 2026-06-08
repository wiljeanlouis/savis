import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import {
  FilterHorizontalIcon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useBomComponentSearchTermFacets } from "../hooks/useBomComponentSearchTermFacets";

interface BomComponentSearchTermFacetsProps {
  selectedSearchTerm?: string;
  onSearchTermChange: (searchTerm: string | undefined) => void;
}

export const BomComponentSearchTermFacets = ({
  selectedSearchTerm,
  onSearchTermChange,
}: BomComponentSearchTermFacetsProps) => {
  const {
    facets,
    filteredFacets,
    searchQuery,
    selectedFacet,
    totalCount,
    selectedSearchTerm: currentSearchTerm,
    onSearchTermChange: handleSearchTermChange,
    setSearchQuery,
  } = useBomComponentSearchTermFacets({
    selectedSearchTerm,
    onSearchTermChange,
  });

  if (!facets?.length) {
    return null;
  }

  const selectedLabel = currentSearchTerm ?? "Tous";
  const selectedCount = selectedFacet?.count ?? totalCount;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex min-w-0 items-center gap-2 py-1 text-sm">
        <span className="max-w-64 truncate">{selectedLabel}</span>
        <Badge variant="secondary">{selectedCount}</Badge>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} />
            Filtrer
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 p-2">
          <DropdownMenuLabel className="px-0 pt-0">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="pointer-events-none absolute top-1.5 left-2 size-4 text-muted-foreground"
              />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder="Filtrer les recherches"
                className="pl-8"
              />
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="min-h-8 justify-between"
            onSelect={() => handleSearchTermChange(undefined)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <HugeiconsIcon
                icon={Tick02Icon}
                strokeWidth={2}
                className={
                  currentSearchTerm === undefined
                    ? "size-4 opacity-100"
                    : "size-4 opacity-0"
                }
              />
              Tous
            </span>
            <Badge variant="secondary">{totalCount}</Badge>
          </DropdownMenuItem>
          <div className="max-h-72 overflow-y-auto">
            {filteredFacets.length ? (
              filteredFacets.map((facet) => (
                <DropdownMenuItem
                  key={facet.search_term}
                  className="min-h-8 justify-between"
                  onSelect={() => handleSearchTermChange(facet.search_term)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      strokeWidth={2}
                      className={
                        currentSearchTerm === facet.search_term
                          ? "size-4 opacity-100"
                          : "size-4 opacity-0"
                      }
                    />
                    <span className="truncate">{facet.search_term}</span>
                  </span>
                  <Badge variant="secondary">{facet.count}</Badge>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                Aucun résultat
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {currentSearchTerm ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleSearchTermChange(undefined)}
        >
          Réinitialiser
        </Button>
      ) : null}
    </div>
  );
};
