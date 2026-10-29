import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResourcesPage } from "@/features/resource/pages/ResourcesPage";
import { useResources } from "@/features/resource/hooks/useResources";

vi.mock("@/features/resource/hooks/useResources");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const save = vi.fn();
const resource = {
  id: "resource-uuid",
  name: "Farine",
  description: "Farine blanche",
  category: "INGREDIENT" as const,
  referenceUnit: "g",
  status: "ACTIVE" as const,
};

function renderPage() {
  render(
    <MemoryRouter>
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
        data: { content: [resource], totalPages: 1 },
      },
      save: { mutateAsync: save, isPending: false },
      changeStatus: { mutate: vi.fn(), isPending: false },
    } as unknown as ReturnType<typeof useResources>);
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
