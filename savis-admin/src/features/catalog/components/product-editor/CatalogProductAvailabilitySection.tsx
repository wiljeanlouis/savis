import { FieldGroup } from "@/shared/ui/field";
import type { CatalogProduct } from "../../types";
import {
  CheckField,
  NumberField,
  TextField,
} from "./CatalogProductEditorFields";
import { EditorSection } from "./CatalogProductEditorSection";
import type { UpdateCatalogProduct } from "./types";

export function CatalogProductAvailabilitySection({
  form,
  onUpdate,
}: {
  form: CatalogProduct;
  onUpdate: UpdateCatalogProduct;
}) {
  return (
    <EditorSection
      id="product-availability"
      title="Disponibilité"
      description="Visibilité du produit, note client et ordre de présentation."
    >
      <FieldGroup className="grid gap-4 md:grid-cols-3">
        <TextField
          label="Note"
          value={form.availabilityNote}
          onChange={(value) => onUpdate("availabilityNote", value)}
        />
        <NumberField
          label="Ordre"
          value={form.displayOrder}
          onChange={(value) => onUpdate("displayOrder", value)}
        />
        <CheckField
          label="Disponible"
          description="Contrôle si le produit est achetable par le client."
          checked={form.available}
          onChange={(value) => onUpdate("available", value)}
        />
      </FieldGroup>
    </EditorSection>
  );
}
