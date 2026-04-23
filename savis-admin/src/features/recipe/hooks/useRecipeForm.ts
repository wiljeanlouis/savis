import { useEffect, useState } from "react";
import type { RecipeIngredient } from "../types";
import { saveDraft, loadDraft, clearDraft } from "../model/recipeDraftStorage";
import { useCreateRecipe } from "./useCreateRecipe";

export const useRecipeForm = () => {
  const draft = loadDraft();

  const [form, setForm] = useState({
    title: draft?.title || ("" as string),
    description: draft?.description || ("" as string),
    imageUrl: draft?.imageUrl || ("" as string),
    instructions: draft?.instructions || ("" as string),
    ingredients: draft?.ingredients || ([] as RecipeIngredient[]),
    cookingMinutes: draft?.cookingMinutes || (0 as number),
    preparationMinutes: draft?.preparationMinutes || (0 as number),
  });

  const mutation = useCreateRecipe();

  useEffect(() => {
    saveDraft(form);
  }, [form]);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addIngredient = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { ingredientId: "", quantity: 0, unit: "" },
      ],
    }));
  };

  const updateIngredient = (index: number, updated: RecipeIngredient) => {
    setForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients.map((item: RecipeIngredient, i: number) =>
          i === index ? updated : item,
        ),
      ],
    }));
  };

  const removeIngredient = (index: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients.filter(
          (_: RecipeIngredient, i: number) => i !== index,
        ),
      ],
    }));
  };

  const submit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    await mutation.mutateAsync(form);
    clearDraft();
  };

  return {
    form,
    updateField,
    addIngredient,
    updateIngredient,
    removeIngredient,
    submit,
    isLoading: mutation.isPending,
  };
};
