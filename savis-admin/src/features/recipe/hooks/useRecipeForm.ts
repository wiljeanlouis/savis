import { useEffect, useState } from "react";
import type { Recipe, RecipeIngredient } from "../types";
import {
  saveDraft,
  loadDraft,
  clearDraft,
  hasDraft,
} from "../model/recipeDraftStorage";
import { usePostRecipe } from "./useRecipeApi";
import { useLoaderData, useNavigate } from "react-router";

export const useRecipeForm = () => {
  const data = useLoaderData<Recipe | null>();

  const draft = loadDraft();

  const initForm: Recipe | null = data?.id ? data : draft;

  const [form, setForm] = useState({
    id: initForm?.id ?? null,
    name: initForm?.name ?? "",
    description: initForm?.description ?? "",
    imageUrl: initForm?.imageUrl ?? "",
    instructions: initForm?.instructions ?? "",
    ingredients: initForm?.ingredients ?? [],
    cookingMinutes: initForm?.cookingMinutes ?? 0,
    preparationMinutes: initForm?.preparationMinutes ?? 0,
  });

  const mutation = usePostRecipe();

  const [isDraftAlertOpen, setIsDraftAlertOpen] = useState(false);

  const navigate = useNavigate();

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isDirty && !form.id) {
      saveDraft(form);
    }
  }, [form, isDirty]);

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  const addIngredient = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { ingredientName: "", quantity: 0, unit: "" },
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

  const clearDraftAndNavigateBack = async () => {
    clearDraft();
    await navigate(-1);
  };

  const submit = async () => {
    try {
      await mutation.mutateAsync(form);
      await clearDraftAndNavigateBack();
    } catch (error) {
      console.error("Error creating recipe:", error);
    }
  };

  const cancel = async () => {
    if (hasDraft()) {
      setIsDraftAlertOpen(true);
    } else {
      await navigate(-1);
    }
  };

  const onDeleteDraftAlert = async () => {
    await clearDraftAndNavigateBack();
  };

  const onKeepDraftAlert = async () => {
    await navigate(-1);
  };

  return {
    form,
    updateField,
    addIngredient,
    updateIngredient,
    removeIngredient,
    submit,
    cancel,
    onDeleteDraftAlert,
    onKeepDraftAlert,
    isDraftAlertOpen,
    setIsDraftAlertOpen,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
};
