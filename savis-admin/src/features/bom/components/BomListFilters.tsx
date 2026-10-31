import { ListFilterPopover } from "@/shared/components/ListFilterPopover";
import {
  ListSearchInput,
  ListSelectFilter,
} from "@/shared/components/ListFilters";
import { costActivityLabel } from "../model/bomCostPresentation";
import type { ActivityType } from "../types";
const activityTypes: ActivityType[] = [
  "PREP",
  "COOK",
  "ASSEMBLY",
  "PACKAGING",
  "INSTALLATION",
  "DELIVERY",
  "CLEANUP",
  "CUSTOM",
];
export function BomListFilters({
  params,
  update,
  reset,
  yieldUnits,
}: {
  params: URLSearchParams;
  update: (key: string, value: string) => void;
  reset: () => void;
  yieldUnits: string[];
}) {
  const count = ["type", "activity", "unit"].filter((key) => {
    const value = params.get(key);
    return value && value !== "ALL";
  }).length;
  return (
    <section
      aria-label="Recherche et filtres des compositions"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <ListSearchInput
        label="Rechercher par nom ou description"
        placeholder="Rechercher par nom ou description"
        value={params.get("search") ?? ""}
        onChange={(value) => update("search", value)}
      />
      <ListFilterPopover
        label="Filtres des compositions"
        count={count}
        onClear={reset}
      >
        <ListSelectFilter
          inPanel
          label="Type de composition"
          value={params.get("type") ?? "ALL"}
          onChange={(value) => update("type", value)}
          options={[
            ["ALL", "Tous les types"],
            ["FOOD", "Alimentaire"],
            ["MATERIAL", "Matériel"],
          ]}
        />

        <ListSelectFilter
          inPanel
          label="Unité de rendement"
          value={params.get("unit") ?? "ALL"}
          onChange={(value) => update("unit", value)}
          options={[
            ["ALL", "Toutes les unités"],
            ...yieldUnits.map((unit) => [unit, unit] as [string, string]),
          ]}
        />
        <ListSelectFilter
          inPanel
          label="Activité"
          value={params.get("activity") ?? "ALL"}
          onChange={(value) => update("activity", value)}
          options={[
            ["ALL", "Toutes les activités"],
            ["NONE", "Sans activité"],
            ...activityTypes.map(
              (type) => [type, costActivityLabel(type)] as [string, string],
            ),
          ]}
        />
      </ListFilterPopover>
    </section>
  );
}
