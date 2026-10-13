export interface PdfDocument {
  content: Blob;
  fileName: string;
}

/** Opens a window synchronously, then displays the asynchronously loaded PDF. */
export async function openPdfInNewTab(
  loadDocument: () => Promise<PdfDocument>,
): Promise<boolean> {
  const previewWindow = window.open("about:blank", "_blank");
  if (!previewWindow) return false;

  previewWindow.opener = null;
  previewWindow.document.title = "Chargement du PDF…";
  previewWindow.document.body.textContent = "Chargement du PDF…";

  try {
    const document = await loadDocument();
    const pdf = new File([document.content], document.fileName, {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(pdf);
    previewWindow.location.replace(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  } catch (error) {
    previewWindow.close();
    throw error;
  }
}
