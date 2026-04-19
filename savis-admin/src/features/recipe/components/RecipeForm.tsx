import { Input } from "@/shared/ui/input"
import { useRecipeForm } from "../hooks/useRecipeForm"
import { IngredientInput } from "./IngredientInput"
import { Button } from "@/shared/ui/button"

export const RecipeForm = () => {
  const {
    title,
    setTitle,
    ingredients,
    addIngredient,
    updateIngredient,
    removeIngredient,
    submit,
    isLoading
  } = useRecipeForm()

  return (
    <div>
      <h2>Create Recipe</h2>

      <Input
        placeholder="Recipe title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <h3>Ingredients</h3>

      {ingredients.map((ingredient, index) => (
        <IngredientInput
          key={index}
          value={ingredient}
          onChange={val => updateIngredient(index, val)}
          onRemove={() => removeIngredient(index)}
        />
      ))}

      <Button onClick={addIngredient}>Add Ingredient</Button>

      <br /><br />

      <Button onClick={submit} disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Recipe"}
      </Button>
    </div>
  )
}