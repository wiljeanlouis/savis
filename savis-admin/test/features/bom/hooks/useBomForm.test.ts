import { usePostBom } from "@/features/bom/hooks/useBomApi";
import { useBomForm } from "@/features/bom/hooks/useBomForm";
import {
  clearDraft,
  hasDraft,
  loadDraft,
  saveDraft,
} from "@/features/bom/model/bomDraftStorage";
import type { Bom } from "@/features/bom/types";
import { act, renderHook } from "@testing-library/react";
import { useLoaderData, useNavigate } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockBom: Bom = {
  id: "1",
  name: "Test Bom",
  description: "A delicious test bom",
  imageUrl: "http://example.com/image.jpg",
  instructions: "Mix ingredients and cook.",
  components: [
    { componentName: "Flour", quantity: 2, unit: "cups" },
    { componentName: "Sugar", quantity: 1, unit: "cup" },
  ],
  activities: [
    { type: "PREP", minutes: 15, sequence: 1 },
    { type: "COOK", minutes: 30, sequence: 2 },
  ],
  yield: { quantity: 1, unit: "PORTION" },
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

vi.mock("@/features/bom/hooks/useBomApi", () => ({
  usePostBom: vi.fn(),
}));

vi.mock("@/features/bom/model/bomDraftStorage", () => ({
  saveDraft: vi.fn(),
  loadDraft: vi.fn(),
  clearDraft: vi.fn(),
  hasDraft: vi.fn(),
}));

describe("useBomForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("initialization", () => {
    it("should initialize form with loader data", () => {
      vi.mocked(useLoaderData).mockReturnValue(mockBom);
      vi.mocked(usePostBom).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useBomForm());

      expect(result.current.form).toEqual(mockBom);
    });

    it("should initialize form with draft if loader data is null", () => {
      const draftBom: Bom = {
        id: null,
        name: "Draft Bom",
        description: "A draft bom",
        imageUrl: "",
        instructions: "",
        components: [],
        activities: [
          { type: "PREP", minutes: 0, sequence: 1 },
          { type: "COOK", minutes: 0, sequence: 2 },
        ],
        yield: { quantity: 1, unit: "PORTION" },
      };

      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostBom).mockReturnValue(mockMutation);
      vi.mocked(loadDraft).mockReturnValue(draftBom);

      const { result } = renderHook(() => useBomForm());

      expect(result.current.form).toEqual(draftBom);
    });

    it("should initialize form with empty values if no loader data or draft", () => {
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostBom).mockReturnValue(mockMutation);
      vi.mocked(loadDraft).mockReturnValue(null);

      const { result } = renderHook(() => useBomForm());

      expect(result.current.form).toEqual({
        id: null,
        name: "",
        description: "",
        imageUrl: "",
        instructions: "",
        components: [],
        activities: [
          { type: "PREP", minutes: 0, sequence: 1 },
          { type: "COOK", minutes: 0, sequence: 2 },
        ],
        yield: { quantity: 1, unit: "portion" },
      });
    });
  });

  describe("draft handling", () => {
    it("should save draft when form is dirty and has no id", () => {
      // Mock useLoaderData to return null (new bom)
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostBom).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.updateField("name", "New Bom");
      });

      expect(saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({ name: "New Bom" }),
      );
    });

    it("should not save draft when form is updated but has an id", () => {
      vi.mocked(useLoaderData).mockReturnValue(mockBom);
      vi.mocked(usePostBom).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.updateField("name", "Updated Bom");
      });

      expect(saveDraft).not.toHaveBeenCalled();
    });
  });

  describe("component management", () => {
    it("should add component to form", () => {
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostBom).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.addComponent();
      });

      expect(result.current.form.components).toHaveLength(1);
      expect(result.current.form.components[0]).toEqual({
        componentName: "",
        quantity: 0,
        unit: "",
        selectedOfferId: null,
      });
    });

    it("should update component in form", () => {
      const initialBom: Bom = {
        id: "1",
        name: "Test Bom",
        description: "",
        imageUrl: "",
        instructions: "",
        components: [{ componentName: "Flour", quantity: 2, unit: "cups" }],
        activities: [
          { type: "PREP", minutes: 0, sequence: 1 },
          { type: "COOK", minutes: 0, sequence: 2 },
        ],
        yield: { quantity: 1, unit: "PORTION" },
      };

      vi.mocked(useLoaderData).mockReturnValue(initialBom);
      vi.mocked(usePostBom).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.updateComponent(0, {
          componentName: "Sugar",
          quantity: 1,
          unit: "cup",
        });
      });

      expect(result.current.form.components[0]).toEqual({
        componentName: "Sugar",
        quantity: 1,
        unit: "cup",
      });
    });

    it("should remove component from form", () => {
      const initialBom: Bom = {
        id: "1",
        name: "Test Bom",
        description: "",
        imageUrl: "",
        instructions: "",
        components: [
          { componentName: "Flour", quantity: 2, unit: "cups" },
          { componentName: "Sugar", quantity: 1, unit: "cup" },
        ],
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

      vi.mocked(useLoaderData).mockReturnValue(initialBom);
      vi.mocked(usePostBom).mockReturnValue(mockMutation);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.removeComponent(0);
      });

      expect(result.current.form.components).toEqual([
        { componentName: "Sugar", quantity: 1, unit: "cup" },
      ]);
    });
  });

  describe("form submission", () => {
    it("should clear draft when form is submitted", async () => {
      const mockNavigate = vi.fn();
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostBom).mockReturnValue(mockMutation);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.updateField("name", "New Bom");
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(clearDraft).toHaveBeenCalled();
    });

    it("should navigate back after form submission", async () => {
      const mockNavigate = vi.fn();
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostBom).mockReturnValue(mockMutation);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.updateField("name", "New Bom");
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
      vi.mocked(usePostBom).mockReturnValue({
        mutateAsync: vi.fn().mockRejectedValue(error),
      } as never);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.updateField("name", "New Bom");
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
      vi.mocked(usePostBom).mockReturnValue(mockMutation);
      vi.mocked(hasDraft).mockReturnValue(true);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isDraftAlertOpen).toBe(true);
    });

    it("should clear draft and navigate back when delete is called on draft alert", async () => {
      const mockNavigate = vi.fn();
      vi.mocked(useLoaderData).mockReturnValue(null);
      vi.mocked(usePostBom).mockReturnValue(mockMutation);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);
      vi.mocked(hasDraft).mockReturnValue(true);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.updateField("name", "New Bom");
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
      vi.mocked(usePostBom).mockReturnValue(mockMutation);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);
      vi.mocked(hasDraft).mockReturnValue(true);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.updateField("name", "New Bom");
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
      vi.mocked(usePostBom).mockReturnValue(mockMutation);
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);
      vi.mocked(hasDraft).mockReturnValue(false);

      const { result } = renderHook(() => useBomForm());

      act(() => {
        result.current.cancel();
      });

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
