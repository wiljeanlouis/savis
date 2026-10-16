import type { Bom } from "@/features/bom/types";
import {
  emptyChoiceOption,
  emptyIngredientOption,
  type CatalogProduct,
} from "../../types";
import {
  BomField,
  CheckField,
  MoneyField,
  NumberField,
  RemoveButton,
  TextField,
} from "./CatalogProductEditorFields";
import { CollectionSection } from "./CatalogProductEditorSection";
import type { UpdateCatalogProduct } from "./types";

export function CatalogProductOptionsSection({
  form,
  boms,
  showChoices,
  showIngredients,
  onUpdate,
}: {
  form: CatalogProduct;
  boms: Bom[];
  showChoices: boolean;
  showIngredients: boolean;
  onUpdate: UpdateCatalogProduct;
}) {
  const updateChoice = (
    index: number,
    patch: Partial<
      NonNullable<CatalogProduct["choiceGroup"]>["options"][number]
    >,
  ) => {
    onUpdate("choiceGroup", {
      ...form.choiceGroup!,
      options: form.choiceGroup!.options.map((item, current) =>
        current === index ? { ...item, ...patch } : item,
      ),
    });
  };

  const updateIngredient = (
    index: number,
    patch: Partial<CatalogProduct["ingredientOptions"][number]>,
  ) => {
    onUpdate(
      "ingredientOptions",
      form.ingredientOptions.map((item, current) =>
        current === index ? { ...item, ...patch } : item,
      ),
    );
  };

  if (showChoices) {
    return (
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
          onUpdate("choiceGroup", {
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
              onUpdate("choiceGroup", {
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
              onUpdate("choiceGroup", {
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
                onUpdate("choiceGroup", {
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
    );
  }

  if (showIngredients) {
    return (
      <CollectionSection
        id="product-options"
        title="Options et Choix"
        description="Extras personnalisables. Le prix extra s'ajoute au-dessus de la quantité par défaut."
        onAdd={() =>
          onUpdate("ingredientOptions", [
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
              onChange={(value) => updateIngredient(index, { code: value })}
            />
            <TextField
              label="Nom"
              value={option.name}
              onChange={(value) => updateIngredient(index, { name: value })}
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
                onUpdate(
                  "ingredientOptions",
                  form.ingredientOptions.filter((_, item) => item !== index),
                )
              }
            />
          </div>
        ))}
      </CollectionSection>
    );
  }

  return null;
}
