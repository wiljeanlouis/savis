import { Input } from "@/shared/ui/input";
import { type RecipeIngredient } from "../types";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/shared/ui/select";

interface Props {
  value: RecipeIngredient;
  onChange: (value: RecipeIngredient) => void;
  onRemove: () => void;
}

export const IngredientInput = ({ value, onChange, onRemove }: Props) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Field className="col-span-2">
        <Input
          placeholder="Ingredient Name"
          value={value.ingredientName}
          required
          onChange={(e) =>
            onChange({ ...value, ingredientName: e.target.value })
          }
        />
      </Field>

      <div className="flex items-center gap-2">
        <Field>
          <Input
            placeholder="Quantity"
            value={value.quantity}
            required
            onChange={(e) =>
              onChange({ ...value, quantity: Number(e.target.value) })
            }
          />
        </Field>
        <Field>
          <Select
            value={value.unit}
            onValueChange={(e) => onChange({ ...value, unit: e })}
          >
            <SelectTrigger className="w-32" id="recipe-form-unit-list-f59">
              <SelectValue placeholder="Unité" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem key="grams" value="GRAM">
                  g
                </SelectItem>
                <SelectItem key="kilograms" value="KILOGRAM">
                  kg
                </SelectItem>
                <SelectItem key="liters" value="LITER">
                  L
                </SelectItem>
                <SelectItem key="milliliters" value="MILLILITER">
                  mL
                </SelectItem>
                <SelectItem key="piece" value="PIECE">
                  pièce
                </SelectItem>
                <SelectItem key="portion" value="PORTION">
                  portion
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Button type="button" variant="destructive" onClick={onRemove}>
          X
        </Button>
      </div>
    </div>
  );
};
