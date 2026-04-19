import { useEffect, useState } from "react"
import { type RecipeIngredient } from "../types"
import { saveDraft, loadDraft, clearDraft } from "../model/recipeDraftStorage"
import { useCreateRecipe } from "./useCreateRecipe"

export const useRecipeForm = () => {
  const draft = loadDraft()

  const [title, setTitle] = useState(draft?.title || "")
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    draft?.ingredients || []
  )

  const mutation = useCreateRecipe()

  // autosave
  useEffect(() => {
    saveDraft({ title, ingredients })
  }, [title, ingredients])

  const addIngredient = () => {
    setIngredients(prev => [
      ...prev,
      { ingredientId: "", quantity: 0, unit: "" }
    ])
  }

  const updateIngredient = (index: number, updated: RecipeIngredient) => {
    setIngredients(prev =>
      prev.map((item, i) => (i === index ? updated : item))
    )
  }

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const submit = async () => {
    await mutation.mutateAsync({
      title,
      ingredients
    })
    clearDraft()
  }

  return {
    title,
    setTitle,
    ingredients,
    addIngredient,
    updateIngredient,
    removeIngredient,
    submit,
    isLoading: mutation.isPending
  }
}