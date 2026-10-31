import { PictureFrame } from "@/shared/components/PictureFrame";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Textarea } from "@/shared/ui/textarea";
import type { CatalogProduct } from "../../types";
import { TextField } from "./CatalogProductEditorFields";
import { EditorSection } from "./CatalogProductEditorSection";
import type { UpdateCatalogProduct } from "./types";

export function CatalogProductInformationSection({
  form,
  gallery,
  isEditing,
  onNameChange,
  onCodeChange,
  onSlugChange,
  onGalleryChange,
  onUpdate,
}: {
  form: CatalogProduct;
  gallery: string;
  isEditing: boolean;
  onNameChange: (name: string) => void;
  onCodeChange: (code: string) => void;
  onSlugChange: (slug: string) => void;
  onGalleryChange: (gallery: string) => void;
  onUpdate: UpdateCatalogProduct;
}) {
  return (
    <EditorSection
      id="product-information"
      title="Informations générales"
      description="Nom, identifiants, description et images présentés dans le catalogue."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <TextField label="Nom" value={form.name} onChange={onNameChange} />
          </div>
          <TextField
            label="Code"
            description={
              isEditing
                ? "Identifiant interne stable du produit."
                : "Généré depuis le nom; vous pouvez le modifier."
            }
            value={form.code}
            onChange={onCodeChange}
          />
          <TextField
            label="Slug"
            description={
              isEditing
                ? "Identifiant public stable utilisé dans l'URL."
                : "Généré depuis le nom; vous pouvez le modifier."
            }
            value={form.slug}
            onChange={onSlugChange}
          />
          <Field className="md:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={form.description}
              onChange={(event) => onUpdate("description", event.target.value)}
            />
          </Field>
          <Field className="md:col-span-2">
            <TextField
              label="Image principale"
              value={form.imageUrl}
              onChange={(value) => onUpdate("imageUrl", value)}
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
            onChange={(event) => onGalleryChange(event.target.value)}
          />
        </Field>
      </FieldGroup>
    </EditorSection>
  );
}
