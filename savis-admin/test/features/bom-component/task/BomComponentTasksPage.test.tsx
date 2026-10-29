import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BomComponentTasksPage } from "@/features/bom-component/task/pages/BomComponentTasksPage";
import { getBomComponentTasks } from "@/features/bom-component/task/api/bomComponentTaskApi";
vi.mock("@/features/bom-component/task/api/bomComponentTaskApi", () => ({
  getBomComponentTasks: vi.fn(),
}));
function mount() {
  render(
    <MemoryRouter
      initialEntries={["/offers/tasks?status=FAILED&type=REFRESH_OFFER"]}
    >
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <BomComponentTasksPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
describe("Acquisition tasks", () => {
  beforeEach(() => vi.resetAllMocks());

  it("keeps server sorting and pagination with the shared list controls", async () => {
    vi.mocked(getBomComponentTasks).mockImplementation(async (options) => ({
      items: [
        {
          id: "task-1",
          type: "REFRESH_OFFER",
          status: "FAILED",
          payload: { offer_id: "offer-1" },
          created_at: "2026-10-29T12:00:00Z",
          updated_at: "2026-10-29T12:01:00Z",
          completed_at: null,
          error_message: "Offre indisponible",
        },
      ],
      page: options?.page ?? 1,
      size: options?.size ?? 20,
      total_items: 25,
      total_pages: 2,
    }));
    const user = userEvent.setup();
    mount();
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Offre indisponible")).toBeInTheDocument();
    expect(screen.getByText("25 tâches")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Résultats par page" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    await screen.findByText("Page 2 sur 2");
    expect(getBomComponentTasks).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 2,
        status: "FAILED",
        type: "REFRESH_OFFER",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Type" }));
    await screen.findByText("Page 1 sur 2");
    expect(getBomComponentTasks).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        sortBy: "type",
        status: "FAILED",
        type: "REFRESH_OFFER",
      }),
    );
  });
  it("passes supported URL filters to Executor and shows an empty state", async () => {
    vi.mocked(getBomComponentTasks).mockResolvedValueOnce({
      items: [],
      page: 1,
      size: 20,
      total_items: 0,
      total_pages: 0,
    });
    mount();
    expect(
      await screen.findByText(
        "Aucune tâche ne correspond aux filtres sélectionnés.",
      ),
    ).toBeInTheDocument();
    expect(getBomComponentTasks).toHaveBeenLastCalledWith({
      page: 1,
      size: 20,
      sortBy: "created_at",
      sortDirection: "desc",
      status: "FAILED",
      type: "REFRESH_OFFER",
    });
    expect(
      screen.getByRole("button", { name: "Actualiser" }),
    ).toBeInTheDocument();
  });
  it("shows retryable errors instead of treating failures as empty results", async () => {
    vi.mocked(getBomComponentTasks).mockRejectedValueOnce(
      new Error("indisponible"),
    );
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de charger les tâches d'acquisition.",
    );
    expect(
      screen.getByRole("button", { name: "Réessayer" }),
    ).toBeInTheDocument();
  });
});
