import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
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
const bomFilterKeys = [
  "search",
  "type",
  "unit",
  "activity",
  "components",
  "sort",
];

export function BomListFilters({
  params,
  units,
  update,
  reset,
}: {
  params: URLSearchParams;
  units: string[];
  update: (key: string, value: string) => void;
  reset: () => void;
}) {
  const activeAdvancedFilters = [
    params.get("activity") && params.get("activity") !== "ALL",
    params.get("components") && params.get("components") !== "ALL",
  ].filter(Boolean).length;
  const [advancedExpanded, setAdvancedExpanded] = useState(
    activeAdvancedFilters > 0,
  );

  return (
    <section
      aria-label="Recherche et filtres des compositions"
      className="space-y-2 rounded-xl border p-3"
    >
      <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_auto_auto]">
        <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
          Rechercher par nom ou description
          <Input
            placeholder="Nom ou description…"
            value={params.get("search") ?? ""}
            onChange={(event) => update("search", event.target.value)}
          />
        </label>
        <Filter
          label="Type de composition"
          value={params.get("type") ?? "ALL"}
          onChange={(value) => update("type", value)}
          options={[
            ["ALL", "Tous les types"],
            ["FOOD", "Alimentaire"],
            ["MATERIAL", "Matériel"],
          ]}
        />
        <Filter
          label="Unité de rendement"
          value={params.get("unit") ?? "ALL"}
          onChange={(value) => update("unit", value)}
          options={[
            ["ALL", "Toutes les unités"],
            ...units.map((unit) => [unit, unit] as [string, string]),
          ]}
        />
        <Button
          type="button"
          variant="outline"
          aria-expanded={advancedExpanded}
          aria-controls="bom-advanced-filters"
          onClick={() => setAdvancedExpanded((expanded) => !expanded)}
          className="justify-between gap-2"
        >
          {advancedExpanded ? "Moins de filtres" : "Plus de filtres"}
          {activeAdvancedFilters > 0 && (
            <Badge variant="secondary">{activeAdvancedFilters}</Badge>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-label="Réinitialiser les filtres"
          onClick={reset}
          disabled={!bomFilterKeys.some((key) => params.has(key))}
        >
          Réinitialiser
        </Button>
      </div>
      <div
        id="bom-advanced-filters"
        hidden={!advancedExpanded}
        className="flex flex-wrap items-end gap-2 border-t pt-2"
      >
        <Filter
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
        <Filter
          label="Composants"
          value={params.get("components") ?? "ALL"}
          onChange={(value) => update("components", value)}
          options={[
            ["ALL", "Toutes les compositions"],
            ["WITH", "Avec composants"],
            ["WITHOUT", "Sans composant"],
          ]}
        />
      </div>
    </section>
  );
}
function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="grid min-w-0 gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([code, text]) => (
            <SelectItem key={code} value={code}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
