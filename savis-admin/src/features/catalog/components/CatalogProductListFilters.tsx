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
  const advancedKeys = ["category", "availability", "sort"];
  const activeAdvancedFilters = advancedKeys.filter((key) => {
    const value = params.get(key);
    return value !== null && value !== "ALL" && value !== "name-asc";
  });
  const [advancedExpanded, setAdvancedExpanded] = useState(
    activeAdvancedFilters.length > 0,
  );
  const activeLabels = [
    params.get("category") &&
      params.get("category") !== "ALL" &&
      `Catégorie : ${
        productCategories.find(
          (category) => category.value === params.get("category"),
        )?.label ?? params.get("category")
      }`,
    params.get("availability") &&
      params.get("availability") !== "ALL" &&
      `Disponibilité : ${
        params.get("availability") === "AVAILABLE"
          ? "Disponibles"
          : "Indisponibles"
      }`,
    params.get("sort") &&
      params.get("sort") !== "name-asc" &&
      `Tri : ${params.get("sort") === "name-desc" ? "Z à A" : "A à Z"}`,
  ].filter(Boolean);

  return (
    <section
      aria-label="Recherche et filtres des produits"
      className="space-y-2 border-b pb-3"
    >
      <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto_auto]">
        <label className="grid min-w-0 gap-1 text-sm text-muted-foreground">
          Rechercher un produit
          <Input
            placeholder="Nom, code ou description…"
            value={params.get("search") ?? ""}
            onChange={(event) => update("search", event.target.value)}
          />
        </label>
        <Filter
          label="Publication"
          value={params.get("publication") ?? "ALL"}
          onChange={(value) => update("publication", value)}
          options={[
            ["ALL", "Tous les statuts"],
            ["PUBLISHED", "Publiés"],
            ["DRAFT", "Brouillons"],
          ]}
        />
        <Button
          type="button"
          variant="outline"
          aria-expanded={advancedExpanded}
          aria-controls="catalog-advanced-filters"
          onClick={() => setAdvancedExpanded((expanded) => !expanded)}
          className="justify-between gap-2"
        >
          {advancedExpanded ? "Moins de filtres" : "Plus de filtres"}
          {activeAdvancedFilters.length > 0 && (
            <Badge variant="secondary">{activeAdvancedFilters.length}</Badge>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-label="Réinitialiser les filtres"
          onClick={() => {
            reset();
            setAdvancedExpanded(false);
          }}
          disabled={
            !["search", "category", "publication", "availability", "sort"].some(
              (key) => params.has(key),
            )
          }
        >
          Réinitialiser
        </Button>
      </div>
      {activeLabels.length > 0 && !advancedExpanded && (
        <p className="text-sm text-muted-foreground">
          Filtres actifs : {activeLabels.join(" · ")}
        </p>
      )}
      <div
        id="catalog-advanced-filters"
        hidden={!advancedExpanded}
        className="flex flex-wrap items-end gap-2 border-t pt-2"
      >
        <Filter
          label="Catégorie"
          value={params.get("category") ?? "ALL"}
          onChange={(value) => update("category", value)}
          options={[
            ["ALL", "Toutes les catégories"],
            ...productCategories.map(
              (category) =>
                [category.value, category.label] as [string, string],
            ),
          ]}
        />
        <Filter
          label="Disponibilité"
          value={params.get("availability") ?? "ALL"}
          onChange={(value) => update("availability", value)}
          options={[
            ["ALL", "Tous les produits"],
            ["AVAILABLE", "Disponibles"],
            ["UNAVAILABLE", "Indisponibles"],
          ]}
        />
        <Filter
          label="Tri"
          value={params.get("sort") ?? "name-asc"}
          onChange={(value) => update("sort", value)}
          options={[
            ["name-asc", "Nom : A à Z"],
            ["name-desc", "Nom : Z à A"],
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
      <span className="text-sm text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="h-9 w-full text-sm">
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
