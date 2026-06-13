import {
  saveDraft,
  loadDraft,
  clearDraft,
  hasDraft,
} from "@/features/bom/model/bomDraftStorage";
import type { Bom } from "@/features/bom/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("BomDraftStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("Use id when provided", () => {
    it("should save and load draft by id", () => {
      const bom: Bom = {
        id: "test-id",
        name: "Test Bom",
        type: "FOOD",
        description: "A test bom",
        imageUrl: "",
        instructions: "",
        components: [],
        activities: [
          { type: "PREP", minutes: 0, sequence: 1 },
          { type: "COOK", minutes: 0, sequence: 2 },
        ],
        yield: { quantity: 1, unit: "PORTION" },
      };
      saveDraft(bom);

      const loaded = loadDraft(bom.id!);
      expect(loaded).toEqual(bom);
    });

    it("should return null if no draft found for id", () => {
      const loaded = loadDraft("non-existent-id");
      expect(loaded).toBeNull();
      expect(hasDraft("non-existent-id")).toBe(false);
    });

    it("should clear draft by id", () => {
      const bom: Bom = {
        id: "test-id",
        name: "Test Bom",
        type: "FOOD",
        description: "A test bom",
        imageUrl: "",
        instructions: "",
        components: [],
        activities: [
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
        ],
        yield: { quantity: 1, unit: "PORTION" },
      };
      saveDraft(bom);

      let loaded = loadDraft(bom.id!);
      expect(loaded).toEqual(bom);

      clearDraft(bom.id!);

      loaded = loadDraft(bom.id!);
      expect(loaded).toBeNull();
    });

    it("should check if draft exists by id", () => {
      const bom: Bom = {
        id: "test-id",
        name: "Test Bom",
        type: "FOOD",
        description: "A test bom",
        imageUrl: "",
        instructions: "",
        components: [],
        activities: [
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
        ],
        yield: { quantity: 1, unit: "PORTION" },
      };
      saveDraft(bom);

      expect(hasDraft(bom.id!)).toBe(true);

      clearDraft(bom.id!);

      const hasNoDraft = loadDraft(bom.id!) === null;
      expect(hasNoDraft).toBe(true);
      expect(hasDraft(bom.id!)).toBe(false);
    });

    it("should not interfere with drafts of other ids", () => {
      const bom1: Bom = {
        id: "id-1",
        name: "Bom 1",
        type: "FOOD",
        description: "First bom",
        imageUrl: "",
        instructions: "",
        components: [],
        activities: [
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
        ],
        yield: { quantity: 1, unit: "PORTION" },
      };
      const bom2: Bom = {
        id: "id-2",
        name: "Bom 2",
        type: "MATERIAL",
        description: "Second bom",
        imageUrl: "",
        instructions: "",
        components: [],
        activities: [
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
        ],
        yield: { quantity: 1, unit: "PORTION" },
      };
      saveDraft(bom1);
      saveDraft(bom2);

      let loaded1 = loadDraft(bom1.id!);
      let loaded2 = loadDraft(bom2.id!);
      expect(loaded1).toEqual(bom1);
      expect(loaded2).toEqual(bom2);

      clearDraft(bom1.id!);

      loaded1 = loadDraft(bom1.id!);
      loaded2 = loadDraft(bom2.id!);
      expect(loaded1).toBeNull();
      expect(loaded2).toEqual(bom2);

      clearDraft(bom2.id!);

      loaded2 = loadDraft(bom2.id!);
      expect(loaded2).toBeNull();
    });
  });

  describe("Use KEY when id is not provided", () => {
    it("should save and load draft by KEY", () => {
      const bom: Bom = {
        id: null,
        name: "Test Bom",
        type: "FOOD",
        description: "A test bom",
        imageUrl: "",
        instructions: "",
        components: [],
        activities: [
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
        ],
        yield: { quantity: 1, unit: "PORTION" },
      };
      saveDraft(bom);

      const loaded = loadDraft();
      expect(loaded).toEqual(bom);
    });

    it("should return null if no draft found for KEY", () => {
      const loaded = loadDraft();
      expect(loaded).toBeNull();
      expect(hasDraft()).toBe(false);
    });

    it("should clear draft for KEY", () => {
      const bom: Bom = {
        id: null,
        name: "Test Bom",
        type: "FOOD",
        description: "A test bom",
        imageUrl: "",
        instructions: "",
        components: [],
        activities: [
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
        ],
        yield: { quantity: 1, unit: "PORTION" },
      };
      saveDraft(bom);

      let loaded = loadDraft(bom.id!);
      expect(loaded).toEqual(bom);

      clearDraft();

      loaded = loadDraft(bom.id!);
      expect(loaded).toBeNull();
    });

    it("should check if draft exists for KEY", () => {
      const bom: Bom = {
        id: null,
        name: "Test Bom",
        type: "FOOD",
        description: "A test bom",
        imageUrl: "",
        instructions: "",
        components: [],
        activities: [
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
        ],
        yield: { quantity: 1, unit: "PORTION" },
      };
      saveDraft(bom);

      const hasDraft = loadDraft() !== null;
      expect(hasDraft).toBe(true);

      clearDraft();

      const hasNoDraft = loadDraft() === null;
      expect(hasNoDraft).toBe(true);
    });
  });
});
