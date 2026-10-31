import type { ReactNode } from "react";
import {
  useDeleteBom,
  useGetBoms,
  usePostBom,
} from "@/features/bom/hooks/useBomApi";
import { api } from "@/shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bom } from "../fixtures/costing";

afterEach(() => vi.restoreAllMocks());

describe("BOM query invalidation", () => {
  it("refreshes the shared unpriced list after saving and deleting despite its freshness window", async () => {
    const unpriced = { ...bom, price: null, costing: null };
    const updated = { ...unpriced, name: "Composition modifiée" };
    const get = vi
      .spyOn(api, "get")
      .mockResolvedValueOnce({ data: [unpriced] })
      .mockResolvedValueOnce({ data: [updated] })
      .mockResolvedValueOnce({ data: [] });
    vi.spyOn(api, "post").mockResolvedValue({ data: bom.id });
    vi.spyOn(api, "delete").mockResolvedValue({ status: 204 });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => ({
        list: useGetBoms(),
        save: usePostBom(),
        remove: useDeleteBom(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data).toEqual([unpriced]));
    await act(async () => {
      await result.current.save.mutateAsync(updated);
    });
    await waitFor(() => expect(result.current.list.data).toEqual([updated]));
    expect(queryClient.getQueryData(["boms"])).toEqual([updated]);
    await act(async () => {
      await result.current.remove.mutateAsync(bom.id!);
    });
    await waitFor(() => expect(result.current.list.data).toEqual([]));
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      "/boms",
      "/boms",
      "/boms",
    ]);
    queryClient.clear();
  });
});
