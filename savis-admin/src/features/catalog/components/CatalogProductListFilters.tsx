import { ListFilterPopover } from "@/shared/components/ListFilterPopover";
import {
  ListSearchInput,
  ListSelectFilter,
} from "@/shared/components/ListFilters";
import { productCategories } from "../types";
export function CatalogProductListFilters({
  params,
  update,
  reset,
}: {
  params: URLSearchParams;
  update: (key: string, value: string) => void;
  reset: () => void;
}) {
  const count = ["publication", "category"].filter((key) => {
    const value = params.get(key);
    return value && value !== "ALL";
  }).length;
  return (
    <section
      aria-label="Recherche et filtres des produits"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <ListSearchInput
        label="Rechercher un produit"
        placeholder="Rechercher par nom, code ou description"
        value={params.get("search") ?? ""}
        onChange={(value) => update("search", value)}
      />
      <ListFilterPopover
        label="Filtres des produits"
        count={count}
        onClear={reset}
      >
        <ListSelectFilter
          inPanel
          label="Publication"
          value={params.get("publication") ?? "ALL"}
          onChange={(value) => update("publication", value)}
          options={[
            ["ALL", "Tous les statuts"],
            ["PUBLISHED", "Publiés"],
            ["DRAFT", "Brouillons"],
          ]}
        />
        <ListSelectFilter
          inPanel
          label="Catégorie"
          value={params.get("category") ?? "ALL"}
          onChange={(value) => update("category", value)}
          options={[
            ["ALL", "Toutes les catégories"],
            ...productCategories.map(
              (c) => [c.value, c.label] as [string, string],
            ),
          ]}
        />
      </ListFilterPopover>
    </section>
  );
}
