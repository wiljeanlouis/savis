import {
  saveDraft,
  loadDraft,
  clearDraft,
  hasDraft,
} from "@/features/recipe/model/recipeDraftStorage";
import type { Recipe } from "@/features/recipe/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("RecipeDraftStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("Use id when provided", () => {
    it("should save and load draft by id", () => {
      const recipe: Recipe = {
        id: "test-id",
        name: "Test Recipe",
        description: "A test recipe",
        imageUrl: "",
        instructions: "",
        ingredients: [],
        cookingMinutes: 0,
        preparationMinutes: 0,
      };
      saveDraft(recipe);

      const loaded = loadDraft(recipe.id!);
      expect(loaded).toEqual(recipe);
    });

    it("should return null if no draft found for id", () => {
      const loaded = loadDraft("non-existent-id");
      expect(loaded).toBeNull();
      expect(hasDraft("non-existent-id")).toBe(false);
    });

    it("should clear draft by id", () => {
      const recipe: Recipe = {
        id: "test-id",
        name: "Test Recipe",
        description: "A test recipe",
        imageUrl: "",
        instructions: "",
        ingredients: [],
        cookingMinutes: 0,
        preparationMinutes: 0,
      };
      saveDraft(recipe);

      let loaded = loadDraft(recipe.id!);
      expect(loaded).toEqual(recipe);

      clearDraft(recipe.id!);

      loaded = loadDraft(recipe.id!);
      expect(loaded).toBeNull();
    });

    it("should check if draft exists by id", () => {
      const recipe: Recipe = {
        id: "test-id",
        name: "Test Recipe",
        description: "A test recipe",
        imageUrl: "",
        instructions: "",
        ingredients: [],
        cookingMinutes: 0,
        preparationMinutes: 0,
      };
      saveDraft(recipe);

      expect(hasDraft(recipe.id!)).toBe(true);

      clearDraft(recipe.id!);

      const hasNoDraft = loadDraft(recipe.id!) === null;
      expect(hasNoDraft).toBe(true);
      expect(hasDraft(recipe.id!)).toBe(false);
    });

    it("should not interfere with drafts of other ids", () => {
      const recipe1: Recipe = {
        id: "id-1",
        name: "Recipe 1",
        description: "First recipe",
        imageUrl: "",
        instructions: "",
        ingredients: [],
        cookingMinutes: 0,
        preparationMinutes: 0,
      };
      const recipe2: Recipe = {
        id: "id-2",
        name: "Recipe 2",
        description: "Second recipe",
        imageUrl: "",
        instructions: "",
        ingredients: [],
        cookingMinutes: 0,
        preparationMinutes: 0,
      };
      saveDraft(recipe1);
      saveDraft(recipe2);

      let loaded1 = loadDraft(recipe1.id!);
      let loaded2 = loadDraft(recipe2.id!);
      expect(loaded1).toEqual(recipe1);
      expect(loaded2).toEqual(recipe2);

      clearDraft(recipe1.id!);

      loaded1 = loadDraft(recipe1.id!);
      loaded2 = loadDraft(recipe2.id!);
      expect(loaded1).toBeNull();
      expect(loaded2).toEqual(recipe2);

      clearDraft(recipe2.id!);

      loaded2 = loadDraft(recipe2.id!);
      expect(loaded2).toBeNull();
    });
  });

  describe("Use KEY when id is not provided", () => {
    it("should save and load draft by KEY", () => {
      const recipe: Recipe = {
        id: null,
        name: "Test Recipe",
        description: "A test recipe",
        imageUrl: "",
        instructions: "",
        ingredients: [],
        cookingMinutes: 0,
        preparationMinutes: 0,
      };
      saveDraft(recipe);

      const loaded = loadDraft();
      expect(loaded).toEqual(recipe);
    });

    it("should return null if no draft found for KEY", () => {
      const loaded = loadDraft();
      expect(loaded).toBeNull();
      expect(hasDraft()).toBe(false);
    });

    it("should clear draft for KEY", () => {
      const recipe: Recipe = {
        id: null,
        name: "Test Recipe",
        description: "A test recipe",
        imageUrl: "",
        instructions: "",
        ingredients: [],
        cookingMinutes: 0,
        preparationMinutes: 0,
      };
      saveDraft(recipe);

      let loaded = loadDraft(recipe.id!);
      expect(loaded).toEqual(recipe);

      clearDraft();

      loaded = loadDraft(recipe.id!);
      expect(loaded).toBeNull();
    });

    it("should check if draft exists for KEY", () => {
      const recipe: Recipe = {
        id: null,
        name: "Test Recipe",
        description: "A test recipe",
        imageUrl: "",
        instructions: "",
        ingredients: [],
        cookingMinutes: 0,
        preparationMinutes: 0,
      };
      saveDraft(recipe);

      const hasDraft = loadDraft() !== null;
      expect(hasDraft).toBe(true);

      clearDraft();

      const hasNoDraft = loadDraft() === null;
      expect(hasNoDraft).toBe(true);
    });
  });
});
