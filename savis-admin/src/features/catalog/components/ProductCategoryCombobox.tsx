import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useSaveProductCategory } from "../hooks/useCatalogApi";
import type { ProductCategory } from "../types";

interface Props {
  categories: ProductCategory[];
  value: string;
  onChange: (categoryId: string) => void;
}

export function ProductCategoryCombobox({
  categories,
  value,
  onChange,
}: Props) {
  const saveCategory = useSaveProductCategory();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = categories.find((category) => category.id === value);
  const normalizedSearch = normalize(search);

  const availableCategories = useMemo(
    () =>
      categories
        .filter((category) => category.active || category.id === value)
        .filter(
          (category) =>
            !normalizedSearch ||
            normalize(category.name).includes(normalizedSearch),
        )
        .sort((left, right) => left.name.localeCompare(right.name, "fr")),
    [categories, normalizedSearch, value],
  );

  const categoryExists = categories.some(
    (category) => normalize(category.name) === normalizedSearch,
  );
  const categoryName = search.trim();
  const canCreate = categoryName.length > 0 && !categoryExists;

  const createCategory = async () => {
    try {
      const categoryId = await saveCategory.mutateAsync({
        id: null,
        code: slugify(categoryName),
        name: categoryName,
        active: true,
        displayOrder: categories.length,
      });
      onChange(categoryId);
      setSearch("");
      setOpen(false);
      toast.success(`Catégorie « ${categoryName} » ajoutée.`);
    } catch {
      toast.error("Impossible d’ajouter la catégorie.");
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={selected ? "" : "text-muted-foreground"}>
            {selected?.name ?? "Sélectionner ou créer une catégorie"}
          </span>
          <span aria-hidden="true">⌄</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) gap-2 p-2"
      >
        <Input
          autoFocus
          value={search}
          placeholder="Rechercher une catégorie..."
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canCreate) {
              event.preventDefault();
              void createCategory();
            }
          }}
        />
        <div className="max-h-52 space-y-1 overflow-y-auto">
          {availableCategories.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant="ghost"
              className="w-full justify-between"
              onClick={() => {
                onChange(category.id!);
                setSearch("");
                setOpen(false);
              }}
            >
              <span>{category.name}</span>
              {category.id === value && <span aria-hidden="true">✓</span>}
            </Button>
          ))}
          {availableCategories.length === 0 && !canCreate && (
            <p className="px-2 py-3 text-center text-muted-foreground">
              Aucune catégorie trouvée.
            </p>
          )}
        </div>
        {canCreate && (
          <Button
            type="button"
            className="w-full justify-start"
            disabled={saveCategory.isPending}
            onClick={() => void createCategory()}
          >
            {saveCategory.isPending
              ? "Sauvegarde..."
              : `Sauvegarder « ${categoryName} »`}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
