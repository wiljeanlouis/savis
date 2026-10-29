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
}: {
  params: URLSearchParams;
  update: (key: string, value: string) => void;
}) {
  return (
    <section
      aria-label="Recherche et filtres des produits"
      className="flex flex-wrap items-end gap-3 rounded-xl border p-3"
    >
      <label className="grid min-w-48 flex-1 gap-1 text-xs text-muted-foreground">
        Rechercher un produit
        <Input
          placeholder="Nom, code ou description…"
          value={params.get("search") ?? ""}
          onChange={(event) => update("search", event.target.value)}
        />
      </label>
      <Filter
        label="Catégorie"
        value={params.get("category") ?? "ALL"}
        onChange={(value) => update("category", value)}
        options={[
          ["ALL", "Toutes les catégories"],
          ...productCategories.map(
            (category) => [category.value, category.label] as [string, string],
          ),
        ]}
      />
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
    <div className="grid gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="w-44">
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
