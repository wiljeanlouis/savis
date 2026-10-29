import { BomPage } from "@/features/bom/pages/BomPage";
import { getBom } from "@/features/bom/api/bomApi";
import type { Bom } from "@/features/bom/types";
import { api, executorApi } from "@/shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bom, costing, missingCosting } from "../fixtures/costing";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
  vi.spyOn(executorApi, "post").mockRejectedValue(
    new Error("Unexpected acquisition"),
  );
  vi.spyOn(toast, "success").mockReturnValue("success");
  vi.spyOn(toast, "error").mockReturnValue("error");
});

afterEach(() => {
  expect(executorApi.post).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderEditor(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: "/boms", element: <h1>Liste des compositions</h1> },
      { path: "/boms/add", loader: () => null, element: <BomPage /> },
      {
        path: "/boms/:id",
        loader: ({ params }) => getBom(params.id!),
        element: <BomPage />,
      },
    ],
    { initialEntries: ["/boms", path], initialIndex: 1 },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, client };
}

describe("BOM save and stay", () => {
  it("stays on the existing composition and reloads the saved cost and yield before enabling save again", async () => {
    const initial: Bom = { ...bom, costing: missingCosting };
    const updated: Bom = {
      ...bom,
      name: "Composition actualisée",
      yield: { quantity: 8, unit: "portion" },
      costing: { ...costing, yieldQuantity: 8 },
    };
    let finishRefresh!: (value: { data: Bom }) => void;
    const refresh = new Promise<{ data: Bom }>((resolve) => {
      finishRefresh = resolve;
    });
    const get = vi
      .spyOn(api, "get")
      .mockResolvedValueOnce({ data: initial })
      .mockReturnValueOnce(refresh);
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: bom.id });
    const { router, client } = renderEditor(`/boms/${bom.id}`);
    const user = userEvent.setup();
    const name = await screen.findByRole("textbox", { name: "Nom" });
    expect(screen.getByText("Coût incomplet")).toBeVisible();
    await user.clear(name);
    await user.type(name, updated.name);
    const quantity = screen.getByRole("spinbutton", { name: "Rendement" });
    await user.clear(quantity);
    await user.type(quantity, "8");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(
      screen.getByRole("button", { name: "Enregistrement..." }),
    ).toBeDisabled();
    expect(router.state.location.pathname).toBe(`/boms/${bom.id}`);
    await act(async () => {
      finishRefresh({ data: updated });
    });
    expect(await screen.findByText("Coût complet")).toBeVisible();
    expect(screen.getByLabelText("Synthèse des coûts")).toHaveTextContent(
      "8 portion",
    );
    expect(screen.getByRole("textbox", { name: "Nom" })).toHaveValue(
      updated.name,
    );
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      "/boms",
      expect.objectContaining({
        id: bom.id,
        name: updated.name,
        yield: updated.yield,
      }),
    );
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      `/boms/${bom.id}`,
      `/boms/${bom.id}`,
    ]);
    await user.type(
      screen.getByRole("textbox", { name: "Description" }),
      " suite",
    );
    expect(toast.success).toHaveBeenCalledOnce();
    client.clear();
  });

  it("opens the newly saved composition, clears its draft and uses its id for subsequent saves", async () => {
    const saved: Bom = {
      ...bom,
      name: "Nouvelle composition",
      description: "Description",
      yield: { quantity: 1, unit: "portion" },
      costing: { ...costing, yieldQuantity: 1 },
    };
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: saved });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: saved.id });
    const { router, client } = renderEditor("/boms/add");
    const user = userEvent.setup();
    await user.type(
      await screen.findByRole("textbox", { name: "Nom" }),
      saved.name,
    );
    await user.type(
      screen.getByRole("textbox", { name: "Description" }),
      saved.description,
    );
    await user.type(
      screen.getByRole("textbox", { name: "Image" }),
      saved.imageUrl,
    );
    expect(get).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(
      await screen.findByRole("heading", { name: "Modifier la composition" }),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe(`/boms/${saved.id}`);
    expect(localStorage.getItem("bom-draft")).toBeNull();
    expect(screen.getByText("Coût complet")).toBeVisible();
    expect(post.mock.calls[0][1]).toEqual(
      expect.objectContaining({ id: null, name: saved.name }),
    );
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[1][1]).toEqual(
      expect.objectContaining({ id: saved.id }),
    );
    expect(toast.success).toHaveBeenCalledTimes(2);
    await act(async () => {
      await router.navigate(-1);
    });
    expect(router.state.location.pathname).toBe("/boms");
    client.clear();
  });

  it("preserves entered values and stays on detail when saving fails without reloading costs", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: bom });
    vi.spyOn(api, "post").mockRejectedValue(new Error("Service indisponible"));
    const { router, client } = renderEditor(`/boms/${bom.id}`);
    const user = userEvent.setup();
    const name = await screen.findByRole("textbox", { name: "Nom" });
    await user.type(name, " modifiée");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledOnce());
    expect(toast.success).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe(`/boms/${bom.id}`);
    expect(name).toHaveValue(`${bom.name} modifiée`);
    expect(get).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled();
    client.clear();
  });
});
