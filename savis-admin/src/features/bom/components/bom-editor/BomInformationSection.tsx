import { EditorSection } from "@/shared/components/EditorSection";
import { Field, FieldLabel, FieldGroup } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { PictureFrame } from "@/shared/components/PictureFrame";
import type { BomType } from "../../types";
import type { useBomForm } from "../../hooks/useBomForm";

type Props = Pick<ReturnType<typeof useBomForm>, "form" | "updateField">;

export function BomInformationSection({ form, updateField }: Props) {
  return (
    <EditorSection
      id="bom-information"
      title="Informations générales"
      description="Identifiez la composition et ajoutez une image pour la reconnaître."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <FieldGroup>
          <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)]">
            <Field>
              <FieldLabel htmlFor="bom-form-name">Nom</FieldLabel>
              <Input
                id="bom-form-name"
                placeholder="Boeuf bourgignon, Arche décorative, Sac d'emballage 10'', etc"
                value={form.name}
                onChange={(e) => {
                  updateField("name", e.target.value);
                }}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="bom-form-type">
                Type de composition
              </FieldLabel>
              <Select
                value={form.type}
                onValueChange={(value) => {
                  updateField("type", value as BomType);
                }}
              >
                <SelectTrigger id="bom-form-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="FOOD">Aliment</SelectItem>
                    <SelectItem value="MATERIAL">Matériel</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <Field>
            <FieldLabel htmlFor="bom-form-description">Description</FieldLabel>
            <Input
              id="bom-form-description"
              placeholder="Une recette à base de viande de boeuf, Une arche décorative faite de ballons de taille 8'', Sac d'emballage 10'' "
              value={form.description}
              onChange={(e) => {
                updateField("description", e.target.value);
              }}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="bom-form-image-url">Image</FieldLabel>
            <Input
              id="bom-form-image-url"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={(e) => {
                updateField("imageUrl", e.target.value);
              }}
              required
            />
          </Field>
        </FieldGroup>

        <Field>
          <FieldLabel>Aperçu</FieldLabel>
          <PictureFrame imageUrl={form.imageUrl} alt={form.name} />
        </Field>
      </div>
    </EditorSection>
  );
}
