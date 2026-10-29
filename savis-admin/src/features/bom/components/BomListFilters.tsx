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
  return (
    <section
      aria-label="Recherche et filtres des compositions"
      className="flex flex-wrap items-end gap-3 rounded-xl border p-3"
    >
      <label className="grid min-w-0 flex-1 basis-56 gap-1 text-xs text-muted-foreground">
        Rechercher une composition
        <Input
          placeholder="Rechercher dans les compositions"
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
      <Filter
        label="Tri"
        value={params.get("sort") === "desc" ? "desc" : "asc"}
        onChange={(value) => update("sort", value)}
        options={[
          ["asc", "Nom : A à Z"],
          ["desc", "Nom : Z à A"],
        ]}
      />
      <Button
        variant="ghost"
        onClick={reset}
        disabled={!bomFilterKeys.some((key) => params.has(key))}
      >
        Réinitialiser les filtres
      </Button>
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
        <SelectTrigger aria-label={label} className="w-48 max-w-full">
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
