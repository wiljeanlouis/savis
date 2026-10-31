import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  productCategories,
  subcategoriesForCategory,
  type CatalogProduct,
  type CommercialType,
  type ProductCategory,
  type ProductSubcategory,
  type ProductType,
} from "../../types";
import { NumberField } from "./CatalogProductEditorFields";
import { EditorSection } from "./CatalogProductEditorSection";
import type { UpdateCatalogProduct } from "./types";

export function CatalogProductClassificationSection({
  form,
  onCategoryChange,
  onUpdate,
}: {
  form: CatalogProduct;
  onCategoryChange: (category: ProductCategory) => void;
  onUpdate: UpdateCatalogProduct;
}) {
  const availableSubcategories = subcategoriesForCategory(form.category);

  return (
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
              onCategoryChange(value as ProductCategory)
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
              onUpdate(
                "subcategory",
                value === "NONE" ? null : (value as ProductSubcategory),
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Aucune sous-catégorie</SelectItem>
              {availableSubcategories.map((subcategory) => (
                <SelectItem key={subcategory.value} value={subcategory.value}>
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
              onUpdate("commercialType", value as CommercialType)
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
            Distingue ce qui est vendu; les coûts internes restent dans les
            compositions.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Configuration</FieldLabel>
          <Select
            value={form.productType}
            onValueChange={(value) =>
              onUpdate("productType", value as ProductType)
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
          <FieldDescription>
            Choisissez le flux métier : simple, choix unique, bundle ou
            ingrédients personnalisables.
          </FieldDescription>
        </Field>
        <NumberField
          label="Marge cible (%)"
          description="Entrez 30 pour une marge cible de 30 %. Le backend stocke 0,30."
          value={form.targetMarginRate * 100}
          onChange={(value) => onUpdate("targetMarginRate", value / 100)}
        />
      </FieldGroup>
    </EditorSection>
  );
}
