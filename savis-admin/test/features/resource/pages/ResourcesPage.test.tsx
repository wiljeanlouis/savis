import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ResourcesPage } from "@/features/resource/pages/ResourcesPage";
import { useResources } from "@/features/resource/hooks/useResources";

vi.mock("@/features/resource/hooks/useResources");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
});

const save = vi.fn();
const resource = {
  id: "resource-uuid",
  name: "Farine",
  description: "Farine blanche",
  category: "INGREDIENT" as const,
  referenceUnit: "g",
  status: "ACTIVE" as const,
};

function renderPage(url = "/resources") {
  render(
    <MemoryRouter initialEntries={[url]}>
      <ResourcesPage />
    </MemoryRouter>,
  );
}

async function openNewResource() {
  await userEvent.click(
    screen.getByRole("button", { name: "Nouvelle ressource" }),
  );
  return screen.getByRole("dialog", { name: "Nouvelle ressource" });
}

describe("ResourcesPage modal editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    save.mockResolvedValue(resource);
    vi.mocked(useResources).mockReturnValue({
      list: {
        isPending: false,
        isError: false,
        data: { content: [resource], totalPages: 3, totalElements: 45 },
      },
      save: { mutateAsync: save, isPending: false },
      changeStatus: { mutate: vi.fn(), isPending: false },
    } as unknown as ReturnType<typeof useResources>);
  });

  it("keeps search, status and page size in the URL and resets pagination on filter changes", async () => {
    const user = userEvent.setup();
    renderPage("/resources?search=farine&page=2&status=INACTIVE&size=10");
    expect(useResources).toHaveBeenLastCalledWith("farine", 2, "INACTIVE", 10);
    const count = screen.getByText("45 ressources");
    expect(
      count.compareDocumentPosition(screen.getByRole("table")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("Page 3 sur 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Précédent" }));
    expect(useResources).toHaveBeenLastCalledWith("farine", 1, "INACTIVE", 10);
    await user.click(
      screen.getByRole("combobox", { name: "Filtrer par statut" }),
    );
    await user.click(screen.getByRole("option", { name: "Actives" }));
    expect(useResources).toHaveBeenLastCalledWith("farine", 0, "ACTIVE", 10);
    await user.click(
      screen.getByRole("combobox", { name: "Résultats par page" }),
    );
    await user.click(screen.getByRole("option", { name: "50" }));
    expect(useResources).toHaveBeenLastCalledWith("farine", 0, "ACTIVE", 50);
    await user.type(
      screen.getByRole("textbox", { name: "Rechercher les ressources" }),
      " blanche",
    );
    expect(useResources).toHaveBeenLastCalledWith(
      "farine blanche",
      0,
      "ACTIVE",
      50,
    );
  });

  it("uses safe defaults for invalid URL values and preserves status actions", async () => {
    renderPage("/resources?page=-1&status=OTHER&size=999");
    expect(useResources).toHaveBeenLastCalledWith("", 0, undefined, 20);
    expect(screen.getByRole("button", { name: "Précédent" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Désactiver" }));
    expect(
      vi.mocked(useResources).mock.results.at(-1)?.value.changeStatus.mutate,
    ).toHaveBeenCalledWith(
      { id: resource.id, status: "INACTIVE" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it("shows an empty filtered result without a table", () => {
    const current = vi.mocked(useResources).getMockImplementation()!("", 0);
    vi.mocked(useResources).mockReturnValue({
      ...current,
      list: {
        ...current.list,
        data: {
          content: [],
          totalPages: 0,
          totalElements: 0,
          page: 0,
          size: 20,
        },
      },
    } as ReturnType<typeof useResources>);
    renderPage();
    expect(
      screen.getByText(
        "Aucune ressource ne correspond aux filtres sélectionnés.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("opens creation in a modal and adds the resource only on save", async () => {
    renderPage();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const dialog = await openNewResource();
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: "Nom" }),
      "Sucre",
    );
    await userEvent.selectOptions(
      within(dialog).getByLabelText("Unité de référence"),
      "kg",
    );
    expect(save).not.toHaveBeenCalled();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enregistrer" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(save).toHaveBeenCalledWith({
      id: undefined,
      values: {
        name: "Sucre",
        description: null,
        category: "INGREDIENT",
        referenceUnit: "kg",
      },
    });
  });

  it("discards cancelled input and starts the next modal empty", async () => {
    renderPage();
    const dialog = await openNewResource();
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: "Nom" }),
      "Brouillon",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Annuler" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    const reopened = await openNewResource();
    expect(within(reopened).getByRole("textbox", { name: "Nom" })).toHaveValue(
      "",
    );
  });

  it("keeps the modal and entered values after a failed save", async () => {
    save.mockRejectedValue(new Error("Enregistrement impossible"));
    renderPage();
    const dialog = await openNewResource();
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: "Nom" }),
      "Sucre",
    );
    await userEvent.selectOptions(
      within(dialog).getByLabelText("Unité de référence"),
      "g",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enregistrer" }),
    );
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(within(dialog).getByRole("textbox", { name: "Nom" })).toHaveValue(
      "Sucre",
    );
  });

  it("opens existing resources in a prefilled modal and preserves their identity", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = screen.getByRole("dialog", {
      name: "Modifier la ressource",
    });
    expect(within(dialog).getByRole("textbox", { name: "Nom" })).toHaveValue(
      "Farine",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enregistrer" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(save).toHaveBeenCalledWith({
      id: resource.id,
      values: {
        name: resource.name,
        description: resource.description,
        category: resource.category,
        referenceUnit: resource.referenceUnit,
      },
    });
  });
});
