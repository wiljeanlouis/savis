import { useState } from "react";
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { emptyPurchaseMode, type CatalogProduct } from "../../types";
import {
  MoneyField,
  NumberField,
  RemoveButton,
  TextField,
} from "./CatalogProductEditorFields";
import { CollectionSection } from "./CatalogProductEditorSection";
import type { UpdateCatalogProduct } from "./types";

const customPurchaseMode = "CUSTOM";
const purchaseModePresets = [
  { code: "unit", label: "Unité" },
  { code: "half-dozen", label: "Demi-douzaine" },
  { code: "dozen", label: "Douzaine" },
] as const;

export function CatalogProductPurchaseModesSection({
  form,
  onUpdate,
}: {
  form: CatalogProduct;
  onUpdate: UpdateCatalogProduct;
}) {
  const updateMode = (
    index: number,
    patch: Partial<CatalogProduct["purchaseModes"][number]>,
  ) => {
    onUpdate(
      "purchaseModes",
      form.purchaseModes.map((item, current) =>
        current === index ? { ...item, ...patch } : item,
      ),
    );
  };

  return (
    <CollectionSection
      id="product-purchase-modes"
      title="Modes d'achat"
      description="Formats vendus au client : unité, demi-douzaine, douzaine, etc."
      onAdd={() =>
        onUpdate("purchaseModes", [...form.purchaseModes, emptyPurchaseMode()])
      }
    >
      {form.purchaseModes.map((mode, index) => (
        <div
          className="grid gap-3 border-b pb-4 md:grid-cols-2 xl:grid-cols-7"
          key={mode.id}
        >
          <PurchaseModeFormatField
            mode={mode}
            onChange={(patch) => updateMode(index, patch)}
          />
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
                <SelectItem value="SINGLE_CHOICE">Choix unique</SelectItem>
                <SelectItem value="CHOICE_ALLOCATION">Composition</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>
              Composition exige que les quantités choisies totalisent la
              quantité du mode.
            </FieldDescription>
          </Field>
          <RemoveButton
            onClick={() =>
              onUpdate(
                "purchaseModes",
                form.purchaseModes.filter((_, item) => item !== index),
              )
            }
          />
        </div>
      ))}
    </CollectionSection>
  );
}

function PurchaseModeFormatField({
  mode,
  onChange,
}: {
  mode: CatalogProduct["purchaseModes"][number];
  onChange: (patch: { code: string; label: string }) => void;
}) {
  const preset = purchaseModePresets.find(
    (option) => option.code === mode.code && option.label === mode.label,
  );
  const isExistingCustomValue =
    !preset && Boolean(mode.code.trim() || mode.label.trim());
  const [customSelected, setCustomSelected] = useState(isExistingCustomValue);
  const value =
    customSelected || isExistingCustomValue ? customPurchaseMode : preset?.code;

  return (
    <Field>
      <FieldLabel>Format</FieldLabel>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue === customPurchaseMode) {
            setCustomSelected(true);
            onChange({ code: "", label: "" });
            return;
          }

          const nextPreset = purchaseModePresets.find(
            (option) => option.code === nextValue,
          );
          if (!nextPreset) return;

          setCustomSelected(false);
          onChange({ code: nextPreset.code, label: nextPreset.label });
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choisir un format" />
        </SelectTrigger>
        <SelectContent>
          {purchaseModePresets.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.label} · {option.code}
            </SelectItem>
          ))}
          <SelectItem value={customPurchaseMode}>Personnalisé</SelectItem>
        </SelectContent>
      </Select>
      <FieldDescription>
        Le code et le libellé restent modifiables.
      </FieldDescription>
    </Field>
  );
}
