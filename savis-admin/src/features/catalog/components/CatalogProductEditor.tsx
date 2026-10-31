import { useEffect, useMemo, useState } from "react";
import type { Bom } from "@/features/bom/types";
import { DraftAlert } from "@/shared/components/DraftAlert";
import { Button } from "@/shared/ui/button";
import {
  clearDraft,
  hasDraft,
  loadDraft,
  saveDraft,
} from "../model/catalogProductDraftStorage";
import {
  emptyCatalogProduct,
  normalizeSubcategoryForCategory,
  type CatalogProduct,
  type ProductCategory,
} from "../types";
import type { CatalogProductGuideSection } from "./CatalogProductGuideDrawer";
import { CatalogProductAvailabilitySection } from "./product-editor/CatalogProductAvailabilitySection";
import { CatalogProductClassificationSection } from "./product-editor/CatalogProductClassificationSection";
import { CatalogProductCompositionsSection } from "./product-editor/CatalogProductCompositionsSection";
import {
  CatalogProductEditorNavigation,
  type CatalogProductNavigationItem,
} from "./product-editor/CatalogProductEditorNavigation";
import { CatalogProductInformationSection } from "./product-editor/CatalogProductInformationSection";
import { CatalogProductOptionsSection } from "./product-editor/CatalogProductOptionsSection";
import { CatalogProductPurchaseModesSection } from "./product-editor/CatalogProductPurchaseModesSection";

interface Props {
  product?: CatalogProduct;
  boms: Bom[];
  saving: boolean;
  onSave: (product: CatalogProduct) => void | Promise<void>;
  onCancel: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

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

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isEditing && isDirty) {
      saveDraft({ ...form, gallery: textToGallery(gallery) });
    }
  }, [form, gallery, isDirty, isEditing]);

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
  const navigationItems = useMemo<CatalogProductNavigationItem[]>(() => {
    const items: CatalogProductNavigationItem[] = [
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
        <CatalogProductEditorNavigation
          items={navigationItems}
          activeSection={activeSection}
          productType={form.productType}
          onSectionChange={setActiveSection}
        />

        <div className="grid min-w-0 gap-6">
          <form className="grid min-w-0 gap-6" onSubmit={save}>
            <CatalogProductInformationSection
              form={form}
              gallery={gallery}
              isEditing={isEditing}
              onNameChange={updateName}
              onCodeChange={(code) => {
                setGenerateCodeFromName(false);
                update("code", code);
              }}
              onSlugChange={(slug) => {
                setGenerateSlugFromName(false);
                update("slug", slug);
              }}
              onGalleryChange={updateGallery}
              onUpdate={update}
            />
            <CatalogProductClassificationSection
              form={form}
              onCategoryChange={updateCategory}
              onUpdate={update}
            />
            <CatalogProductCompositionsSection
              form={form}
              boms={boms}
              onUpdate={update}
            />
            <CatalogProductPurchaseModesSection form={form} onUpdate={update} />
            <CatalogProductOptionsSection
              form={form}
              boms={boms}
              showChoices={showChoices}
              showIngredients={showIngredients}
              onUpdate={update}
            />
            <CatalogProductAvailabilitySection form={form} onUpdate={update} />

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
