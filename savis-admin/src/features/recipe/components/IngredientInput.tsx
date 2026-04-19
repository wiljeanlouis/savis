import { Input } from "@/shared/ui/input"
import { type RecipeIngredient } from "../types"
import { Button } from "@/shared/ui/button"

interface Props {
  value: RecipeIngredient
  onChange: (value: RecipeIngredient) => void
  onRemove: () => void
}

export const IngredientInput = ({ value, onChange, onRemove }: Props) => {
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
      <Input
        placeholder="Ingredient ID"
        value={value.ingredientId}
        onChange={e =>
          onChange({ ...value, ingredientId: e.target.value })
        }
      />

      <Input
        type="number"
        placeholder="Quantity"
        value={value.quantity}
        onChange={e =>
          onChange({ ...value, quantity: Number(e.target.value) })
        }
      />

      <Input
        placeholder="Unit"
        value={value.unit}
        onChange={e =>
          onChange({ ...value, unit: e.target.value })
        }
      />

      <Button onClick={onRemove}>X</Button>
    </div>
  )
}