import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { BomComponentTasksPage } from "@/features/bom-component/task/pages/BomComponentTasksPage";
import { getBomComponentTasks } from "@/features/bom-component/task/api/bomComponentTaskApi";
vi.mock("@/features/bom-component/task/api/bomComponentTaskApi", () => ({
  getBomComponentTasks: vi.fn(),
}));
function mount() {
  render(
    <MemoryRouter
      initialEntries={[
        "/bom-components/tasks?status=FAILED&type=REFRESH_OFFER",
      ]}
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
