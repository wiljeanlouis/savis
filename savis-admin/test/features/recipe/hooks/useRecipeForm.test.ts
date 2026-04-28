import { usePostRecipe } from "@/features/recipe/hooks/useRecipeApi";
import { useRecipeForm } from "@/features/recipe/hooks/useRecipeForm";
import {
  clearDraft,
  hasDraft,
  loadDraft,
  saveDraft,
} from "@/features/recipe/model/recipeDraftStorage";
import type { Recipe } from "@/features/recipe/types";
import { act, renderHook } from "@testing-library/react";
import { useLoaderData, useNavigate } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRecipe: Recipe = {
  id: "1",
  name: "Test Recipe",
  description: "A delicious test recipe",
  imageUrl: "http://example.com/image.jpg",
  instructions: "Mix ingredients and cook.",
  ingredients: [
    { ingredientName: "Flour", quantity: 2, unit: "cups" },
    { ingredientName: "Sugar", quantity: 1, unit: "cup" },
  ],
  cookingMinutes: 30,
  preparationMinutes: 15,
};

const mockMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
} as never;

vi.mock("react-router", () => ({
  useLoaderData: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock("@/features/recipe/hooks/useRecipeApi", () => ({
  usePostRecipe: vi.fn(),
}));

vi.mock("@/features/recipe/model/recipeDraftStorage", () => ({
  saveDraft: vi.fn(),
  loadDraft: vi.fn(),
  clearDraft: vi.fn(),
  hasDraft: vi.fn(),
}));

describe("useRecipeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("initialization", () => {
    it("should initialize form with loader data", () => {
      vi.mocked(useLoaderData).mockReturnValue(mockRecipe);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useRecipeForm());

      expect(result.current.form).toEqual(mockRecipe);
    });

    it("should initialize form with draft if loader data is null", () => {
      const draftRecipe: Recipe = {
        id: null,
        name: "Draft Recipe",
        description: "A draft recipe",
        imageUrl: "",
        instructions: "",
        ingredients: [],
        cookingMinutes: 0,
        preparationMinutes: 0,
      };

      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);
      vi.mocked(loadDraft).mockReturnValue(draftRecipe);

      const { result } = renderHook(() => useRecipeForm());

      expect(result.current.form).toEqual(draftRecipe);
    });

    it("should initialize form with empty values if no loader data or draft", () => {
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);
      vi.mocked(loadDraft).mockReturnValue(null);

      const { result } = renderHook(() => useRecipeForm());

      expect(result.current.form).toEqual({
        id: null,
        name: "",
        description: "",
        imageUrl: "",
        instructions: "",
        ingredients: [],
        cookingMinutes: 0,
        preparationMinutes: 0,
      });
    });
  });

  describe("draft handling", () => {
    it("should save draft when form is dirty and has no id", () => {
      // Mock useLoaderData to return null (new recipe)
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.updateField("name", "New Recipe");
      });

      expect(saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({ name: "New Recipe" }),
      );
    });

    it("should not save draft when form is updated but has an id", () => {
      vi.mocked(useLoaderData).mockReturnValue(mockRecipe);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.updateField("name", "Updated Recipe");
      });

      expect(saveDraft).not.toHaveBeenCalled();
    });
  });

  describe("ingredient management", () => {
    it("should add ingredient to form", () => {
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.addIngredient();
      });

      expect(result.current.form.ingredients).toHaveLength(1);
      expect(result.current.form.ingredients[0]).toEqual({
        ingredientName: "",
        quantity: 0,
        unit: "",
      });
    });

    it("should update ingredient in form", () => {
      const initialRecipe: Recipe = {
        id: "1",
        name: "Test Recipe",
        description: "",
        imageUrl: "",
        instructions: "",
        ingredients: [{ ingredientName: "Flour", quantity: 2, unit: "cups" }],
        cookingMinutes: 0,
        preparationMinutes: 0,
      };

      vi.mocked(useLoaderData).mockReturnValue(initialRecipe);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.updateIngredient(0, {
          ingredientName: "Sugar",
          quantity: 1,
          unit: "cup",
        });
      });

      expect(result.current.form.ingredients[0]).toEqual({
        ingredientName: "Sugar",
        quantity: 1,
        unit: "cup",
      });
    });

    it("should remove ingredient from form", () => {
      const initialRecipe: Recipe = {
        id: "1",
        name: "Test Recipe",
        description: "",
        imageUrl: "",
        instructions: "",
        ingredients: [
          { ingredientName: "Flour", quantity: 2, unit: "cups" },
          { ingredientName: "Sugar", quantity: 1, unit: "cup" },
        ],
        cookingMinutes: 0,
        preparationMinutes: 0,
      };

      vi.mocked(useLoaderData).mockReturnValue(initialRecipe);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.removeIngredient(0);
      });

      expect(result.current.form.ingredients).toEqual([
        { ingredientName: "Sugar", quantity: 1, unit: "cup" },
      ]);
    });
  });

  describe("form submission", () => {
    it("should clear draft when form is submitted", async () => {
      const mockNavigate = vi.fn();
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.updateField("name", "New Recipe");
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(clearDraft).toHaveBeenCalled();
    });

    it("should navigate back after form submission", async () => {
      const mockNavigate = vi.fn();
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.updateField("name", "New Recipe");
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("should not clear draft if form submission fails", async () => {
      const mockNavigate = vi.fn();
      const error = new Error("Submission failed");
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostRecipe).mockReturnValue({
        mutateAsync: vi.fn().mockRejectedValue(error),
      } as never);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.updateField("name", "New Recipe");
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(clearDraft).not.toHaveBeenCalled();
    });
  });

  describe("form cancellation", () => {
    it("should open draft alert if cancel and has a draft", () => {
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);
      vi.mocked(hasDraft).mockReturnValue(true);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isDraftAlertOpen).toBe(true);
    });

    it("should clear draft and navigate back when delete is called on draft alert", async () => {
      const mockNavigate = vi.fn();
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);
      vi.mocked(hasDraft).mockReturnValue(true);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.updateField("name", "New Recipe");
      });

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isDraftAlertOpen).toBe(true);

      await act(async () => {
        await result.current.onDeleteDraftAlert();
      });

      expect(clearDraft).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("should just navigate back when keep is called on draft alert", async () => {
      const mockNavigate = vi.fn();
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);
      vi.mocked(hasDraft).mockReturnValue(true);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.updateField("name", "New Recipe");
      });

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isDraftAlertOpen).toBe(true);

      await act(async () => {
        await result.current.onKeepDraftAlert();
      });

      expect(clearDraft).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("should navigate back immediately if cancel and no draft", () => {
      const mockNavigate = vi.fn();
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostRecipe).mockReturnValue(mockMutation);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);
      vi.mocked(hasDraft).mockReturnValue(false);

      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.cancel();
      });

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
