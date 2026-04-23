import { Input } from "@/shared/ui/input"
import { useRecipeForm } from "../hooks/useRecipeForm"
import { IngredientInput } from "./IngredientInput"
import { Button } from "@/shared/ui/button"
import type { RecipeIngredient } from "../types"
import { FieldGroup, FieldSet, FieldLegend, FieldDescription, Field, FieldLabel } from "@/shared/ui/field"
import { Textarea } from "@/shared/ui/textarea"
import { Image } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import PictureFrame from "./PictureFrame"

export const RecipeForm = () => {
  const {
    form,
    updateField,
    addIngredient,
    updateIngredient,
    removeIngredient,
    submit,
    isLoading
  } = useRecipeForm();


  return (
    <>
      <h1 className="text-2xl font-semibold">Ajouter une nouvelle recette</h1>

      <form onSubmit={submit}>

        <FieldGroup>
          <div className="grid grid-cols-3 gap-4">

            <div className="space-y-10 col-span-2">
              <FieldSet>

                <FieldGroup>

                  <Field>
                    <FieldLabel htmlFor="recipe-form-name">
                      Nom
                    </FieldLabel>
                    <Input
                      id="recipe-form-name"
                      placeholder="Boeuf bourgignon"
                      value={form.name}
                      onChange={e => updateField("name", e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="recipe-form-description">
                      Description
                    </FieldLabel>
                    <Input
                      id="recipe-form-description"
                      placeholder="Une recette faite de viande de boeuf"
                      value={form.description}
                      onChange={e => updateField("description", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="recipe-form-image-url">
                      Image
                    </FieldLabel>
                    <Input
                      id="recipe-form-image-url"
                      placeholder="https://..."
                      value={form.imageUrl}
                      onChange={e => updateField("imageUrl", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="recipe-form-instructions">
                      Instructions
                    </FieldLabel>
                    <Textarea
                      id="recipe-form-instructions"
                      placeholder="Add any instructions"
                      className="resize-none"
                      value={form.instructions}
                      onChange={e => updateField("instructions", e.target.value)}
                    />
                  </Field>

                  <FieldGroup className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="recipe-form-card-number-uw1">
                        Temps de préparation
                      </FieldLabel>
                      <Input
                        id="recipe-form-card-number-uw1"
                        placeholder="45"
                        value={form.preparationMinutes}
                        onChange={e => updateField("preparationMinutes", Number(e.target.value))}
                        required
                      />
                      <FieldDescription>
                        minutes
                      </FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="recipe-form-card-number-uw1">
                        Temps de cuisson
                      </FieldLabel>
                      <Input
                        id="recipe-form-card-number-uw1"
                        placeholder="15"
                        value={form.cookingMinutes}
                        onChange={e => updateField("cookingMinutes", Number(e.target.value))}
                        required
                      />
                      <FieldDescription>
                        minutes
                      </FieldDescription>
                    </Field>
                  </FieldGroup>


                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Ingrédients</FieldLegend>
                <FieldDescription>
                  La liste des ingrédients de la recette.
                </FieldDescription>
                <FieldGroup>
                  {form.ingredients.map((ingredient: RecipeIngredient, index: number) => (
                    <IngredientInput
                      key={index}
                      value={ingredient}
                      onChange={val => updateIngredient(index, val)}
                      onRemove={() => removeIngredient(index)}
                    />
                  ))}
                  <Button variant="destructive" className="w-32" onClick={addIngredient}>Add Ingredient</Button>
                </FieldGroup>
              </FieldSet>

              <Field orientation="horizontal">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Recipe"}
                </Button>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Field>
            </div>

            <PictureFrame imageUrl={form.imageUrl} />
          </div>
        </FieldGroup>
      </form>

    </>
  )
}