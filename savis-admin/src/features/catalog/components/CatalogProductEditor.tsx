import { useEffect, useMemo, useState } from "react";
import type { Bom } from "@/features/bom/types";
import { PictureFrame } from "@/shared/components/PictureFrame";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { DraftAlert } from "@/shared/components/DraftAlert";
import { cn } from "@/shared/lib/utils";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
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
  normalizeSubcategoryForCategory,
  productCategories,
  subcategoriesForCategory,
  type CatalogProduct,
  type CommercialType,
  type ProductCategory,
  type ProductSubcategory,
  type ProductType,
} from "../types";
import {
  CatalogProductGuide,
  type CatalogProductGuideSection,
} from "./CatalogProductGuideDrawer";
import {
  clearDraft,
  hasDraft,
  loadDraft,
  saveDraft,
} from "../model/catalogProductDraftStorage";
import { BomCombobox } from "./BomCombobox";

interface Props {
  product?: CatalogProduct;
  boms: Bom[];
  saving: boolean;
  onSave: (product: CatalogProduct) => void | Promise<void>;
  onCancel: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

const number = (value: string) => Number(value) || 0;
const galleryToText = (gallery: string[]) => gallery.join("\n");
const textToGallery = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export function CatalogProductEditor({
  product,
  boms,
  saving,
  onSave,
  onCancel,
  onSaved,
  onDirtyChange,
}: Props) {
  const isEditing = Boolean(product);
  const [form, setForm] = useState<CatalogProduct>(() =>
    product ? product : (loadDraft() ?? emptyCatalogProduct()),
  );
  const [gallery, setGallery] = useState(() => galleryToText(form.gallery));
  const [generateCodeFromName, setGenerateCodeFromName] = useState(
    !product && !form.code,
  );
  const [generateSlugFromName, setGenerateSlugFromName] = useState(
    !product && !form.slug,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isDraftAlertOpen, setIsDraftAlertOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<CatalogProductGuideSection>("product-information");
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

  const updateName = (name: string) => {
    const identifier = productIdentifier(name);
    setForm((current) => ({
      ...current,
      name,
      code: generateCodeFromName ? identifier : current.code,
      slug: generateSlugFromName ? identifier : current.slug,
    }));
    setIsDirty(true);
  };

  const updateCategory = (category: ProductCategory) => {
    setForm((current) => ({
      ...current,
      category,
      subcategory: normalizeSubcategoryForCategory(
        current.subcategory,
        category,
      ),
    }));
    setIsDirty(true);
  };

  const availableSubcategories = subcategoriesForCategory(form.category);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isEditing && isDirty) {
      saveDraft({ ...form, gallery: textToGallery(gallery) });
    }
  }, [form, gallery, isDirty, isEditing]);

  const save = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave({
      ...form,
      gallery: textToGallery(gallery),
    });
    if (!isEditing) {
      clearDraft();
    }
    setIsDirty(false);
    onSaved();
  };

  const requestCancel = () => {
    if (!isEditing && (isDirty || hasDraft())) {
      if (isDirty) {
        saveDraft({ ...form, gallery: textToGallery(gallery) });
      }
      setIsDraftAlertOpen(true);
      return;
    }

    if (
      isEditing &&
      isDirty &&
      !window.confirm("Abandonner les modifications non enregistrées ?")
    ) {
      return;
    }

    onCancel();
  };

  const closeAndDeleteDraft = () => {
    clearDraft();
    setIsDraftAlertOpen(false);
    setIsDirty(false);
    onCancel();
  };

  const closeAndKeepDraft = () => {
    saveDraft({ ...form, gallery: textToGallery(gallery) });
    setIsDraftAlertOpen(false);
    setIsDirty(false);
    onCancel();
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
  const navigationItems = useMemo<
    Array<{ id: CatalogProductGuideSection; label: string }>
  >(() => {
    const items: Array<{
      id: CatalogProductGuideSection;
      label: string;
    }> = [
      { id: "product-information", label: "Informations générales" },
      { id: "product-classification", label: "Classification" },
      { id: "product-boms", label: "Compositions" },
      { id: "product-purchase-modes", label: "Modes d'achat" },
    ];

    if (showChoices || showIngredients) {
      items.push({ id: "product-options", label: "Options et Choix" });
    }

    items.push({ id: "product-availability", label: "Disponibilité" });
    return items;
  }, [showChoices, showIngredients]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              left.boundingClientRect.top - right.boundingClientRect.top,
          )[0];

        if (visibleSection) {
          setActiveSection(
            visibleSection.target.id as CatalogProductGuideSection,
          );
        }
      },
      {
        rootMargin: "-96px 0px -65% 0px",
        threshold: 0,
      },
    );

    navigationItems.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [navigationItems]);

  return (
    <>
      <header>
        <div>
          <h1 className="text-2xl font-semibold">
            {product ? "Modifier le produit" : "Nouveau produit"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Le prix est une décision commerciale. Les compositions servent à
            mesurer le coût et la marge.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[11rem_minmax(0,1fr)]">
        <aside className="sticky top-16 z-30 -mx-2 border-b bg-background/95 px-2 backdrop-blur xl:top-20 xl:mx-0 xl:self-start xl:border-b-0 xl:bg-transparent xl:px-0 xl:backdrop-blur-none">
          <p className="mb-2 hidden text-xs font-medium tracking-wide text-muted-foreground uppercase xl:block">
            Dans cette page
          </p>
          <div className="flex min-w-0 items-center gap-2 xl:block">
            <nav
              aria-label="Sections du produit"
              className="flex min-w-0 flex-1 overflow-x-auto xl:-ml-px xl:flex-col xl:overflow-visible xl:border-l"
            >
              {navigationItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={
                    activeSection === item.id ? "location" : undefined
                  }
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "border-b-2 border-transparent px-3 py-2 text-xs whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:border-b-0 xl:border-l-2",
                    activeSection === item.id &&
                      "border-primary bg-primary/10 text-foreground",
                  )}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="shrink-0 border-l pl-2 xl:mt-3 xl:border-l-0 xl:pl-0">
              <CatalogProductGuide
                section={activeSection}
                productType={form.productType}
              />
            </div>
          </div>
        </aside>

        <div className="grid min-w-0 gap-6">
          <form className="grid min-w-0 gap-6" onSubmit={save}>
            <EditorSection
              id="product-information"
              title="Informations générales"
              description="Nom, identifiants, description et images présentés dans le catalogue."
            >
              <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <TextField
                      label="Nom"
                      value={form.name}
                      onChange={updateName}
                    />
                  </div>
                  <TextField
                    label="Code"
                    description={
                      isEditing
                        ? "Identifiant interne stable du produit."
                        : "Généré depuis le nom; vous pouvez le modifier."
                    }
                    value={form.code}
                    onChange={(value) => {
                      setGenerateCodeFromName(false);
                      update("code", value);
                    }}
                  />
                  <TextField
                    label="Slug"
                    description={
                      isEditing
                        ? "Identifiant public stable utilisé dans l'URL."
                        : "Généré depuis le nom; vous pouvez le modifier."
                    }
                    value={form.slug}
                    onChange={(value) => {
                      setGenerateSlugFromName(false);
                      update("slug", value);
                    }}
                  />
                  <Field className="md:col-span-2">
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      value={form.description}
                      onChange={(event) =>
                        update("description", event.target.value)
                      }
                    />
                  </Field>
                  <Field className="md:col-span-2">
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
            </EditorSection>

            <EditorSection
              id="product-classification"
              title="Classification et configuration"
              description="Catégorie, nature commerciale, configuration et marge cible du produit."
            >
              <FieldGroup className="grid gap-4 md:grid-cols-3">
                <Field>
                  <FieldLabel>Catégorie</FieldLabel>
                  <Select
                    value={form.category}
                    onValueChange={(value) =>
                      updateCategory(value as ProductCategory)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Sous-catégorie</FieldLabel>
                  <Select
                    value={form.subcategory ?? "NONE"}
                    onValueChange={(value) =>
                      update(
                        "subcategory",
                        value === "NONE" ? null : (value as ProductSubcategory),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">
                        Aucune sous-catégorie
                      </SelectItem>
                      {availableSubcategories.map((subcategory) => (
                        <SelectItem
                          key={subcategory.value}
                          value={subcategory.value}
                        >
                          {subcategory.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Les options dépendent de la catégorie du produit.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Nature commerciale</FieldLabel>
                  <Select
                    value={form.commercialType}
                    onValueChange={(value) =>
                      update("commercialType", value as CommercialType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOODS">Bien</SelectItem>
                      <SelectItem value="SERVICE">Service</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Distingue ce qui est vendu; les coûts internes restent dans
                    les compositions.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Configuration</FieldLabel>
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
                    Choisissez le flux métier : simple, choix unique, bundle ou
                    ingrédients personnalisables.
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
            </EditorSection>

            <CollectionSection
              id="product-boms"
              title="Compositions de base"
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
                  key={productBom.id}
                >
                  <BomField
                    label="Composition"
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
              id="product-purchase-modes"
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
                  key={mode.id}
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
                id="product-options"
                title="Options et Choix"
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
                    key={option.id}
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
                      label="Composition de l'option"
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
                id="product-options"
                title="Options et Choix"
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
                    key={option.id}
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
                      label="Composition de l'extra"
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

            <EditorSection
              id="product-availability"
              title="Disponibilité"
              description="Visibilité du produit, note client et ordre de présentation."
            >
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
            </EditorSection>

            <div className="sticky bottom-3 z-20 flex flex-wrap justify-end gap-2 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
              <Button type="button" variant="outline" onClick={requestCancel}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
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
            </div>
          </form>
        </div>
      </div>
      <DraftAlert
        isOpen={isDraftAlertOpen}
        setIsOpen={setIsDraftAlertOpen}
        onDelete={closeAndDeleteDraft}
        onKeep={closeAndKeepDraft}
      />
    </>
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
  id,
  title,
  description,
  onAdd,
  children,
}: {
  id: string;
  title: string;
  description: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <EditorSection
      id={id}
      title={title}
      description={description}
      action={
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Ajouter ${title}`}
          onClick={onAdd}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        </Button>
      }
    >
      <FieldGroup>{children}</FieldGroup>
    </EditorSection>
  );
}

function EditorSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="flex scroll-mt-24 flex-col gap-4 rounded-xl border bg-card p-5"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-sm font-medium">
            {title}
          </h2>
          <p className="mt-1 text-xs/relaxed leading-normal text-muted-foreground">
            {description}
          </p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function productIdentifier(name: string) {
  return name
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
      <BomCombobox
        boms={boms}
        value={value}
        required={required}
        onChange={onChange}
      />
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
