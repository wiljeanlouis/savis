import { useState } from "react";
import type { Bom } from "@/features/bom/types";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import {
  emptyCatalogProduct,
  emptyChoiceOption,
  emptyIngredientOption,
  emptyProductBom,
  emptyPurchaseMode,
  type CatalogProduct,
  type ProductCategory,
  type ProductType,
} from "../types";
import { ProductCategoryCombobox } from "./ProductCategoryCombobox";

interface Props {
  product?: CatalogProduct;
  categories: ProductCategory[];
  boms: Bom[];
  saving: boolean;
  onSave: (product: CatalogProduct) => void;
}

const number = (value: string) => Number(value) || 0;

export function CatalogProductDialog({
  product,
  categories,
  boms,
  saving,
  onSave,
}: Props) {
  const initial = () =>
    product ??
    emptyCatalogProduct(categories.find((item) => item.active)?.id ?? "");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CatalogProduct>(initial);
  const [gallery, setGallery] = useState("");

  const reset = () => {
    const next = initial();
    setForm(next);
    setGallery(next.gallery.join("\n"));
  };
  const update = <K extends keyof CatalogProduct>(
    key: K,
    value: CatalogProduct[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const save = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      ...form,
      gallery: gallery
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setOpen(false);
  };

  const showChoices =
    form.productType === "SINGLE_CHOICE" ||
    form.productType === "SINGLE_CHOICE_BUNDLE";
  const showIngredients = form.productType === "INGREDIENT_CUSTOMIZATION";

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) reset();
        setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={product ? "outline" : "default"}>
          {product ? "Modifier" : "Ajouter un produit"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            {product ? "Modifier le produit" : "Nouveau produit"}
          </DialogTitle>
          <DialogDescription>
            Le prix est une décision commerciale. Les BOM servent à mesurer le
            coût et la marge.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-6" onSubmit={save}>
          <FieldSet>
            <FieldLegend>Produit</FieldLegend>
            <FieldGroup className="grid gap-4 md:grid-cols-3">
              <TextField
                label="Nom"
                value={form.name}
                onChange={(value) => update("name", value)}
              />
              <TextField
                label="Code"
                value={form.code}
                onChange={(value) => update("code", value)}
              />
              <TextField
                label="Slug"
                value={form.slug}
                onChange={(value) => update("slug", value)}
              />
              <Field>
                <FieldLabel>Type</FieldLabel>
                <Select
                  value={form.productType}
                  onValueChange={(value) =>
                    update("productType", value as ProductType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="SINGLE_CHOICE">Choix unique</SelectItem>
                    <SelectItem value="SINGLE_CHOICE_BUNDLE">
                      Formats composables
                    </SelectItem>
                    <SelectItem value="INGREDIENT_CUSTOMIZATION">
                      Ingrédients personnalisables
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Catégorie</FieldLabel>
                <ProductCategoryCombobox
                  categories={categories}
                  value={form.categoryId}
                  onChange={(value) => update("categoryId", value)}
                />
              </Field>
              <MoneyField
                label="Prix de base"
                value={form.basePrice.amount}
                onChange={(amount) =>
                  update("basePrice", { amount, currency: "CAD" })
                }
              />
              <NumberField
                label="Marge cible (%)"
                value={form.targetMarginRate * 100}
                onChange={(value) => update("targetMarginRate", value / 100)}
              />
              <TextField
                label="Unité"
                value={form.unitLabel}
                onChange={(value) => update("unitLabel", value)}
              />
              <Field className="md:col-span-3">
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                />
              </Field>
              <TextField
                label="Image principale"
                value={form.imageUrl}
                onChange={(value) => update("imageUrl", value)}
              />
              <Field className="md:col-span-2">
                <FieldLabel>Galerie, une URL par ligne</FieldLabel>
                <Textarea
                  value={gallery}
                  onChange={(event) => setGallery(event.target.value)}
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <CollectionSection
            title="BOM communs"
            onAdd={() =>
              update("productBoms", [
                ...form.productBoms,
                emptyProductBom(
                  form.productBoms.length,
                  boms.find((bom) => bom.id)?.id ?? "",
                ),
              ])
            }
          >
            {form.productBoms.map((productBom, index) => (
              <div
                className="grid gap-3 border-b pb-4 md:grid-cols-4"
                key={productBom.id ?? index}
              >
                <BomField
                  label="BOM"
                  value={productBom.bomId}
                  boms={boms}
                  required
                  onChange={(bomId) =>
                    updateProductBom(index, { bomId: bomId ?? "" })
                  }
                />
                <DecimalField
                  label="Quantité"
                  value={productBom.quantity}
                  onChange={(quantity) => updateProductBom(index, { quantity })}
                />
                <NumberField
                  label="Ordre"
                  value={productBom.displayOrder}
                  onChange={(displayOrder) =>
                    updateProductBom(index, { displayOrder })
                  }
                />
                <RemoveButton
                  onClick={() =>
                    update(
                      "productBoms",
                      form.productBoms.filter((_, item) => item !== index),
                    )
                  }
                />
              </div>
            ))}
          </CollectionSection>

          <CollectionSection
            title="Modes d'achat"
            onAdd={() =>
              update("purchaseModes", [
                ...form.purchaseModes,
                emptyPurchaseMode(),
              ])
            }
          >
            {form.purchaseModes.map((mode, index) => (
              <div
                className="grid gap-3 border-b pb-4 md:grid-cols-6"
                key={mode.id ?? index}
              >
                <TextField
                  label="Code"
                  value={mode.code}
                  onChange={(value) => updateMode(index, { code: value })}
                />
                <TextField
                  label="Libellé"
                  value={mode.label}
                  onChange={(value) => updateMode(index, { label: value })}
                />
                <NumberField
                  label="Quantité"
                  value={mode.quantity}
                  onChange={(value) => updateMode(index, { quantity: value })}
                />
                <MoneyField
                  label="Prix"
                  value={mode.price.amount}
                  onChange={(amount) =>
                    updateMode(index, { price: { amount, currency: "CAD" } })
                  }
                />
                <Field>
                  <FieldLabel>Répartition</FieldLabel>
                  <Select
                    value={mode.allocationType}
                    onValueChange={(value) =>
                      updateMode(index, {
                        allocationType: value as typeof mode.allocationType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Aucune</SelectItem>
                      <SelectItem value="SINGLE_CHOICE">
                        Choix unique
                      </SelectItem>
                      <SelectItem value="CHOICE_ALLOCATION">
                        Composition
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <RemoveButton
                  onClick={() =>
                    update(
                      "purchaseModes",
                      form.purchaseModes.filter((_, item) => item !== index),
                    )
                  }
                />
              </div>
            ))}
          </CollectionSection>

          {showChoices && (
            <CollectionSection
              title="Saveurs et choix"
              onAdd={() => {
                const group = form.choiceGroup ?? {
                  id: null,
                  label: "Farce",
                  required: true,
                  options: [],
                };
                update("choiceGroup", {
                  ...group,
                  options: [...group.options, emptyChoiceOption()],
                });
              }}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <TextField
                  label="Libellé du groupe"
                  value={form.choiceGroup?.label ?? "Farce"}
                  onChange={(label) =>
                    update("choiceGroup", {
                      id: form.choiceGroup?.id ?? null,
                      label,
                      required: form.choiceGroup?.required ?? true,
                      options: form.choiceGroup?.options ?? [],
                    })
                  }
                />
                <CheckField
                  label="Choix obligatoire"
                  checked={form.choiceGroup?.required ?? true}
                  onChange={(required) =>
                    update("choiceGroup", {
                      id: form.choiceGroup?.id ?? null,
                      label: form.choiceGroup?.label ?? "Farce",
                      required,
                      options: form.choiceGroup?.options ?? [],
                    })
                  }
                />
              </div>
              {form.choiceGroup?.options.map((option, index) => (
                <div
                  className="grid gap-3 border-b pb-4 md:grid-cols-4"
                  key={option.id ?? index}
                >
                  <TextField
                    label="Code"
                    value={option.code}
                    onChange={(value) => updateChoice(index, { code: value })}
                  />
                  <TextField
                    label="Nom"
                    value={option.name}
                    onChange={(value) => updateChoice(index, { name: value })}
                  />
                  <BomField
                    label="BOM"
                    value={option.bomId}
                    boms={boms}
                    onChange={(bomId) => updateChoice(index, { bomId })}
                  />
                  <RemoveButton
                    onClick={() =>
                      update("choiceGroup", {
                        ...form.choiceGroup!,
                        options: form.choiceGroup!.options.filter(
                          (_, item) => item !== index,
                        ),
                      })
                    }
                  />
                </div>
              ))}
            </CollectionSection>
          )}

          {showIngredients && (
            <CollectionSection
              title="Ingrédients et extras"
              onAdd={() =>
                update("ingredientOptions", [
                  ...form.ingredientOptions,
                  emptyIngredientOption(),
                ])
              }
            >
              {form.ingredientOptions.map((option, index) => (
                <div
                  className="grid gap-3 border-b pb-4 md:grid-cols-8"
                  key={option.id ?? index}
                >
                  <TextField
                    label="Code"
                    value={option.code}
                    onChange={(value) =>
                      updateIngredient(index, { code: value })
                    }
                  />
                  <TextField
                    label="Nom"
                    value={option.name}
                    onChange={(value) =>
                      updateIngredient(index, { name: value })
                    }
                  />
                  <BomField
                    label="BOM extra"
                    value={option.bomId}
                    boms={boms}
                    onChange={(bomId) => updateIngredient(index, { bomId })}
                  />
                  <NumberField
                    label="Défaut"
                    value={option.defaultQuantity}
                    onChange={(value) =>
                      updateIngredient(index, { defaultQuantity: value })
                    }
                  />
                  <NumberField
                    label="Minimum"
                    value={option.minQuantity}
                    onChange={(value) =>
                      updateIngredient(index, { minQuantity: value })
                    }
                  />
                  <NumberField
                    label="Maximum"
                    value={option.maxQuantity}
                    onChange={(value) =>
                      updateIngredient(index, { maxQuantity: value })
                    }
                  />
                  <MoneyField
                    label="Prix extra"
                    value={option.extraPrice.amount}
                    onChange={(amount) =>
                      updateIngredient(index, {
                        extraPrice: { amount, currency: "CAD" },
                      })
                    }
                  />
                  <RemoveButton
                    onClick={() =>
                      update(
                        "ingredientOptions",
                        form.ingredientOptions.filter(
                          (_, item) => item !== index,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </CollectionSection>
          )}

          <FieldSet>
            <FieldLegend>Disponibilité</FieldLegend>
            <FieldGroup className="grid gap-4 md:grid-cols-4">
              <TextField
                label="Note"
                value={form.availabilityNote}
                onChange={(value) => update("availabilityNote", value)}
              />
              <NumberField
                label="Ordre"
                value={form.displayOrder}
                onChange={(value) => update("displayOrder", value)}
              />
              <CheckField
                label="Disponible"
                checked={form.available}
                onChange={(value) => update("available", value)}
              />
              <CheckField
                label="Publier"
                checked={form.published}
                onChange={(value) => update("published", value)}
              />
            </FieldGroup>
          </FieldSet>

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                saving ||
                !form.categoryId ||
                form.productBoms.some(
                  (productBom) => !productBom.bomId || productBom.quantity <= 0,
                )
              }
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  function updateProductBom(
    index: number,
    patch: Partial<CatalogProduct["productBoms"][number]>,
  ) {
    update(
      "productBoms",
      form.productBoms.map((item, current) =>
        current === index ? { ...item, ...patch } : item,
      ),
    );
  }
  function updateMode(
    index: number,
    patch: Partial<CatalogProduct["purchaseModes"][number]>,
  ) {
    update(
      "purchaseModes",
      form.purchaseModes.map((item, current) =>
        current === index ? { ...item, ...patch } : item,
      ),
    );
  }
  function updateChoice(
    index: number,
    patch: Partial<
      NonNullable<CatalogProduct["choiceGroup"]>["options"][number]
    >,
  ) {
    update("choiceGroup", {
      ...form.choiceGroup!,
      options: form.choiceGroup!.options.map((item, current) =>
        current === index ? { ...item, ...patch } : item,
      ),
    });
  }
  function updateIngredient(
    index: number,
    patch: Partial<CatalogProduct["ingredientOptions"][number]>,
  ) {
    update(
      "ingredientOptions",
      form.ingredientOptions.map((item, current) =>
        current === index ? { ...item, ...patch } : item,
      ),
    );
  }
}

function CollectionSection({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend>{title}</FieldLegend>
        <Button type="button" variant="outline" onClick={onAdd}>
          Ajouter
        </Button>
      </div>
      <FieldGroup>{children}</FieldGroup>
    </FieldSet>
  );
}
function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(number(event.target.value))}
      />
    </Field>
  );
}
function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(number(event.target.value))}
      />
    </Field>
  );
}
function DecimalField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="number"
        min="0.000001"
        step="any"
        required
        value={value}
        onChange={(event) => onChange(number(event.target.value))}
      />
    </Field>
  );
}
function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Field orientation="horizontal">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <FieldLabel>{label}</FieldLabel>
    </Field>
  );
}
function BomField({
  label,
  value,
  boms,
  required = false,
  onChange,
}: {
  label: string;
  value: string | null;
  boms: Bom[];
  required?: boolean;
  onChange: (value: string | null) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        value={value ?? (required ? undefined : "none")}
        onValueChange={(next) => onChange(next === "none" ? null : next)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner un BOM" />
        </SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value="none">Aucun BOM</SelectItem>}
          {boms
            .filter((bom) => bom.id)
            .map((bom) => (
              <SelectItem key={bom.id} value={bom.id!}>
                {bom.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-end">
      <Button type="button" variant="ghost" onClick={onClick}>
        Retirer
      </Button>
    </div>
  );
}
