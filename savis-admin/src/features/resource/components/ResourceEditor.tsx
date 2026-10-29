import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Field, FieldLabel } from "@/shared/ui/field";
import {
  resourceCategories,
  type MaterialResource,
  type ResourceCategory,
  type ResourceValues,
} from "../types";

export function ResourceEditor({
  resource,
  saving,
  onSave,
  onCancel,
}: {
  resource?: MaterialResource;
  saving: boolean;
  onSave: (values: ResourceValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(resource?.name ?? "");
  const [description, setDescription] = useState(resource?.description ?? "");
  const [category, setCategory] = useState<ResourceCategory>(
    resource?.category ?? "INGREDIENT",
  );
  const [unit, setUnit] = useState(resource?.referenceUnit ?? "");
  const required =
    category !== "EQUIPMENT" && category !== "DECORATION_MATERIAL";
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave({
          name,
          description: description || null,
          category,
          referenceUnit: unit || null,
        });
      }}
    >
      <Field>
        <FieldLabel htmlFor="resource-name">Nom</FieldLabel>
        <Input
          id="resource-name"
          required
          maxLength={160}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="resource-description">Description</FieldLabel>
        <Textarea
          id="resource-description"
          maxLength={4000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="resource-category">Catégorie</FieldLabel>
        <select
          id="resource-category"
          className="rounded-md border bg-background p-2"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as ResourceCategory)
          }
        >
          {Object.entries(resourceCategories).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <FieldLabel htmlFor="resource-unit">Unité de référence</FieldLabel>
        <select
          id="resource-unit"
          className="rounded-md border bg-background p-2"
          value={unit}
          required={required}
          onChange={(event) => setUnit(event.target.value)}
        >
          <option value="">Non renseignée</option>
          {["g", "kg", "l", "ml", "piece"].map((value) => (
            <option key={value} value={value}>
              {value === "piece" ? "Pièce" : value}
            </option>
          ))}
        </select>
      </Field>
      <p className="text-xs text-muted-foreground">
        Deux ressources peuvent porter le même nom. Elles restent distinctes et
        ne sont pas fusionnées.
      </p>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button disabled={saving || !name.trim()}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
