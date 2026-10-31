import { EditorSection } from "@/shared/components/EditorSection";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldDescription,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import type { useBomForm } from "../../hooks/useBomForm";

type Props = Pick<
  ReturnType<typeof useBomForm>,
  "form" | "updateField" | "updateYield"
>;

export function BomProductionSection({
  form,
  updateField,
  updateYield,
}: Props) {
  return (
    <EditorSection
      id="bom-production"
      title="Production et rendement"
      description="Précisez la quantité produite et les instructions de fabrication."
    >
      <FieldGroup>
        <FieldGroup className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="bom-form-yield-quantity">Rendement</FieldLabel>
            <Input
              id="bom-form-yield-quantity"
              placeholder="12"
              type="number"
              min={0}
              value={form.yield.quantity}
              onChange={(e) => {
                updateYield("quantity", Number(e.target.value));
              }}
              required
            />
            <FieldDescription>quantité produite</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="bom-form-yield-unit">
              Unité de rendement
            </FieldLabel>
            <Select
              value={form.yield.unit}
              onValueChange={(value) => {
                updateYield("unit", value);
              }}
            >
              <SelectTrigger id="bom-form-yield-unit">
                <SelectValue placeholder="Unité" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="portion">portion</SelectItem>
                  <SelectItem value="piece">pièce</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="l">L</SelectItem>
                  <SelectItem value="ml">mL</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>portion par défaut</FieldDescription>
          </Field>
        </FieldGroup>
        <Field>
          <FieldLabel htmlFor="bom-form-instructions">Instructions</FieldLabel>
          <Textarea
            id="bom-form-instructions"
            placeholder="Décrivez les étapes de fabrication"
            className="resize-none"
            value={form.instructions}
            onChange={(e) => {
              updateField("instructions", e.target.value);
            }}
          />
        </Field>
      </FieldGroup>
    </EditorSection>
  );
}
