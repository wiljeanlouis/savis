import { useEffect, useState } from "react";
import type { Recipe, RecipeActivity, RecipeComponent } from "../types";
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

  const defaultActivities: RecipeActivity[] = [
    {
      type: "PREP",
      minutes: 0,
      sequence: 1,
    },
    {
      type: "COOK",
      minutes: 0,
      sequence: 2,
    },
  ];

  const [form, setForm] = useState({
    id: initForm?.id ?? null,
    name: initForm?.name ?? "",
    description: initForm?.description ?? "",
    imageUrl: initForm?.imageUrl ?? "",
    instructions: initForm?.instructions ?? "",
    components: initForm?.components ?? [],
    activities:
      initForm?.activities && initForm.activities.length >= 2
        ? initForm.activities
        : defaultActivities,
    yield: initForm?.yield ?? { quantity: 1, unit: "portion" },
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

  const updateYield = (field: "quantity" | "unit", value: string | number) => {
    setForm((prev) => ({
      ...prev,
      yield: {
        ...prev.yield,
        [field]: value,
      },
    }));
    setIsDirty(true);
  };

  const addComponent = () => {
    setForm((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        { componentName: "", quantity: 0, unit: "", selectedOfferId: null },
      ],
    }));
  };

  const updateComponent = (index: number, updated: RecipeComponent) => {
    setForm((prev) => ({
      ...prev,
      components: [
        ...prev.components.map((item: RecipeComponent, i: number) =>
          i === index ? updated : item,
        ),
      ],
    }));
  };

  const removeComponent = (index: number) => {
    setForm((prev) => ({
      ...prev,
      components: [
        ...prev.components.filter(
          (_: RecipeComponent, i: number) => i !== index,
        ),
      ],
    }));
  };

  const addActivity = () => {
    setForm((prev) => ({
      ...prev,
      activities: [
        ...prev.activities,
        {
          type: "CUSTOM",
          name: "",
          minutes: 0,
          sequence: prev.activities.length + 1,
        },
      ],
    }));
    setIsDirty(true);
  };

  const updateActivity = (index: number, updated: RecipeActivity) => {
    setForm((prev) => ({
      ...prev,
      activities: prev.activities.map((activity: RecipeActivity, i: number) =>
        i === index ? { ...updated, sequence: index + 1 } : activity,
      ),
    }));
    setIsDirty(true);
  };

  const removeActivity = (index: number) => {
    if (index < 2) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      activities: prev.activities
        .filter((_: RecipeActivity, i: number) => i !== index)
        .map((activity: RecipeActivity, i: number) => ({
          ...activity,
          sequence: i + 1,
        })),
    }));
    setIsDirty(true);
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
    updateYield,
    addComponent,
    updateComponent,
    removeComponent,
    addActivity,
    updateActivity,
    removeActivity,
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
