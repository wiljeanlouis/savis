import { openPdfInNewTab } from "@/shared/lib/openPdfInNewTab";
import { afterEach, describe, expect, it, vi } from "vitest";

function previewWindow() {
  return {
    opener: window,
    document: {
      title: "",
      body: { textContent: "" },
    },
    location: { replace: vi.fn() },
    close: vi.fn(),
  };
}

describe("openPdfInNewTab", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("opens the tab before loading and displays the PDF", async () => {
    vi.useFakeTimers();
    const preview = previewWindow();
    const createObjectURL = vi.fn(() => "blob:pdf-preview");
    const revokeObjectURL = vi.fn();
    vi.spyOn(window, "open").mockReturnValue(preview as unknown as Window);
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const loadDocument = vi.fn(async () => ({
      content: new Blob(["pdf"], { type: "application/pdf" }),
      fileName: "soumission-SOU-1.pdf",
    }));

    await expect(openPdfInNewTab(loadDocument)).resolves.toBe(true);

    expect(window.open).toHaveBeenCalledWith("about:blank", "_blank");
    expect(preview.opener).toBeNull();
    expect(loadDocument).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "soumission-SOU-1.pdf",
        type: "application/pdf",
      }),
    );
    expect(preview.location.replace).toHaveBeenCalledWith("blob:pdf-preview");

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:pdf-preview");
  });

  it("does not load the document when the popup is blocked", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    const loadDocument = vi.fn();

    await expect(openPdfInNewTab(loadDocument)).resolves.toBe(false);

    expect(loadDocument).not.toHaveBeenCalled();
  });

  it("closes the empty tab when loading fails", async () => {
    const preview = previewWindow();
    vi.spyOn(window, "open").mockReturnValue(preview as unknown as Window);
    const error = new Error("PDF unavailable");

    await expect(
      openPdfInNewTab(async () => Promise.reject(error)),
    ).rejects.toBe(error);

    expect(preview.close).toHaveBeenCalledOnce();
  });
});
