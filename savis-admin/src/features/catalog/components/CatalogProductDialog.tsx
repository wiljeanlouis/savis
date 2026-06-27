import { useEffect, useState } from "react";
import type { Bom } from "@/features/bom/types";
import { PictureFrame } from "@/shared/components/PictureFrame";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { DraftAlert } from "@/shared/components/DraftAlert";
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
  FieldContent,
  FieldDescription,
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
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import {
  CatalogProductGuideButton,
  CatalogProductGuidePanel,
} from "./CatalogProductGuideDrawer";
import {
  clearDraft,
  hasDraft,
  loadDraft,
  saveDraft,
} from "../model/catalogProductDraftStorage";

interface Props {
  product?: CatalogProduct;
  categories: ProductCategory[];
  boms: Bom[];
  saving: boolean;
  onSave: (product: CatalogProduct) => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const number = (value: string) => Number(value) || 0;
const galleryToText = (gallery: string[]) => gallery.join("\n");
const textToGallery = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export function CatalogProductDialog({
  product,
  categories,
  boms,
  saving,
  onSave,
  open,
  onOpenChange,
  hideTrigger = false,
}: Props) {
  const isEditing = Boolean(product);
  const initial = () =>
    product ??
    loadDraft() ??
    emptyCatalogProduct(categories.find((item) => item.active)?.id ?? "");
  const [internalOpen, setInternalOpen] = useState(false);
  const [form, setForm] = useState<CatalogProduct>(initial);
  const [gallery, setGallery] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isDraftAlertOpen, setIsDraftAlertOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const reset = () => {
    const next = initial();
    setForm(next);
    setGallery(galleryToText(next.gallery));
    setIsDirty(false);
  };
  const update = <K extends keyof CatalogProduct>(
    key: K,
    value: CatalogProduct[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
  };

  const updateGallery = (value: string) => {
    setGallery(value);
    setIsDirty(true);
  };

  useEffect(() => {
    if (isOpen && !isEditing && isDirty) {
      saveDraft({ ...form, gallery: textToGallery(gallery) });
    }
  }, [form, gallery, isDirty, isEditing, isOpen]);

  const save = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave({
      ...form,
      gallery: textToGallery(gallery),
    });
    if (!isEditing) {
      clearDraft();
    }
    setOpen(false);
  };

  const requestOpenChange = (value: boolean) => {
    if (value) {
      reset();
      setOpen(true);
      return;
    }

    if (!isEditing && hasDraft()) {
      setIsDraftAlertOpen(true);
      return;
    }

    setOpen(false);
  };

  const closeAndDeleteDraft = () => {
    clearDraft();
    setIsDraftAlertOpen(false);
    setOpen(false);
  };

  const closeAndKeepDraft = () => {
    setIsDraftAlertOpen(false);
    setOpen(false);
  };

  const showChoices =
    form.productType === "SINGLE_CHOICE" ||
    form.productType === "SINGLE_CHOICE_BUNDLE";
  const showIngredients = form.productType === "INGREDIENT_CUSTOMIZATION";
  const hasActivePurchaseMode = form.purchaseModes.some((mode) => mode.active);
  const hasInvalidPurchaseMode = form.purchaseModes.some(
    (mode) =>
      !mode.code.trim() ||
      !mode.label.trim() ||
      mode.quantity <= 0 ||
      mode.price.amount < 0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={requestOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant={product ? "outline" : "default"}>
            {product ? "Modifier" : "Ajouter un produit"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className={`max-h-[92vh] overflow-y-auto transition-[max-width] duration-200 sm:max-w-6xl ${
          guideOpen ? "xl:max-w-[min(calc(100vw-2rem),88rem)]" : ""
        }`}
      >
        <DialogHeader className="pr-16">
          <div>
            <DialogTitle>
              {product ? "Modifier le produit" : "Nouveau produit"}
            </DialogTitle>
            <DialogDescription>
              Le prix est une décision commerciale. Les BOM servent à mesurer le
              coût et la marge.
            </DialogDescription>
          </div>
          <div className="absolute top-2 right-10">
            <CatalogProductGuideButton
              open={guideOpen}
              onOpenChange={setGuideOpen}
            />
          </div>
        </DialogHeader>
        <div
          className={
            guideOpen
              ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"
              : "grid gap-6"
          }
        >
          <form className="grid gap-6" onSubmit={save}>
            <FieldSet>
              <FieldLegend>Infos de base</FieldLegend>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
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
                  <Field className="md:col-span-3">
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      value={form.description}
                      onChange={(event) =>
                        update("description", event.target.value)
                      }
                    />
                  </Field>
                  <Field className="md:col-span-3">
                    <TextField
                      label="Image principale"
                      value={form.imageUrl}
                      onChange={(value) => update("imageUrl", value)}
                    />
                  </Field>
                </FieldGroup>

                <Field>
                  <FieldLabel>Aperçu</FieldLabel>
                  <PictureFrame imageUrl={form.imageUrl} alt={form.name} />
                </Field>
              </div>
              <FieldGroup className="grid gap-4 md:grid-cols-3">
                <Field className="md:col-span-2">
                  <FieldLabel>Galerie, une URL par ligne</FieldLabel>
                  <Textarea
                    rows={10}
                    value={gallery}
                    onChange={(event) => updateGallery(event.target.value)}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <FieldGroup className="grid gap-4 md:grid-cols-3">
                <Field>
                  <FieldLabel>Catégorie</FieldLabel>
                  <ProductCategoryCombobox
                    categories={categories}
                    value={form.categoryId}
                    onChange={(value) => update("categoryId", value)}
                  />
                </Field>
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
                      <SelectItem value="SINGLE_CHOICE">
                        Choix unique
                      </SelectItem>
                      <SelectItem value="SINGLE_CHOICE_BUNDLE">
                        Formats composables
                      </SelectItem>
                      <SelectItem value="INGREDIENT_CUSTOMIZATION">
                        Ingrédients personnalisables
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Choisissez le flow métier du produit : simple, choix unique,
                    bundle ou ingrédients personnalisables.
                  </FieldDescription>
                </Field>

                <NumberField
                  label="Marge cible (%)"
                  description="Entrez 30 pour une marge cible de 30 %. Le backend stocke 0,30."
                  value={form.targetMarginRate * 100}
                  onChange={(value) => update("targetMarginRate", value / 100)}
                />
              </FieldGroup>

              <FieldGroup className="grid gap-4 md:grid-cols-3"></FieldGroup>
            </FieldSet>

            <CollectionSection
              title="BOM communs"
              description="Composition toujours incluse dans le coût, peu importe le choix du client."
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
                    onChange={(quantity) =>
                      updateProductBom(index, { quantity })
                    }
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
              description="Formats vendus au client : unité, demi-douzaine, douzaine, etc."
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
                    <FieldDescription>
                      Composition exige que les quantités choisies totalisent la
                      quantité du mode.
                    </FieldDescription>
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
                description="Options visibles pour les produits à choix unique ou bundles."
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
                description="Extras personnalisables. Le prix extra s'ajoute au-dessus de la quantité par défaut."
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
              <FieldGroup className="grid gap-4 md:grid-cols-3">
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
                  description="Contrôle si le produit est achetable par le client."
                  checked={form.available}
                  onChange={(value) => update("available", value)}
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
                    (productBom) =>
                      !productBom.bomId || productBom.quantity <= 0,
                  ) ||
                  !hasActivePurchaseMode ||
                  hasInvalidPurchaseMode
                }
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
          {guideOpen && <CatalogProductGuidePanel />}
        </div>
      </DialogContent>
      <DraftAlert
        isOpen={isDraftAlertOpen}
        setIsOpen={setIsDraftAlertOpen}
        onDelete={closeAndDeleteDraft}
        onKeep={closeAndKeepDraft}
      />
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
  description,
  onAdd,
  children,
}: {
  title: string;
  description?: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <div>
          <FieldLegend>{title}</FieldLegend>
          {description && <FieldDescription>{description}</FieldDescription>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Ajouter ${title}`}
          onClick={onAdd}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        </Button>
      </div>
      <FieldGroup>{children}</FieldGroup>
    </FieldSet>
  );
}
function TextField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
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
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}
function NumberField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
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
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}
function MoneyField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
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
      {description && <FieldDescription>{description}</FieldDescription>}
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
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Field orientation="horizontal">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
      {description ? (
        <FieldContent>
          <FieldLabel>{label}</FieldLabel>
          <FieldDescription>{description}</FieldDescription>
        </FieldContent>
      ) : (
        <FieldLabel>{label}</FieldLabel>
      )}
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
    <div className="flex items-start pt-7">
      <Button
        type="button"
        variant="destructive"
        size="icon-sm"
        aria-label="Retirer"
        onClick={onClick}
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
      </Button>
    </div>
  );
}
