import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useResources } from "@/features/resource/hooks/useResources";
import {
  listResources,
  setResourceStatus,
} from "@/features/resource/api/resourceApi";
import type { MaterialResource, ResourcePage } from "@/features/resource/types";

vi.mock("@/features/resource/api/resourceApi", () => ({
  listResources: vi.fn(),
  saveResource: vi.fn(),
  setResourceStatus: vi.fn(),
}));

const resource: MaterialResource = {
  id: "resource-uuid",
  name: "Farine",
  description: null,
  category: "INGREDIENT",
  referenceUnit: "g",
  status: "ACTIVE",
};
const page: ResourcePage = {
  content: [resource],
  totalElements: 1,
  page: 0,
  size: 20,
  totalPages: 1,
};

afterEach(() => vi.clearAllMocks());

describe("useResources status mutation", () => {
  it("optimistically changes status, restores it after failure, and refreshes the list", async () => {
    let rejectStatus!: (error: Error) => void;
    vi.mocked(listResources).mockResolvedValue(page);
    vi.mocked(setResourceStatus).mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectStatus = reject;
        }),
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    const queryKey = [
      "resources",
      { search: "", page: 0, status: undefined, pageSize: 20 },
    ] as const;
    queryClient.setQueryData(queryKey, page);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useResources("", 0), { wrapper });

    let mutation!: Promise<MaterialResource>;
    act(() => {
      mutation = result.current.changeStatus.mutateAsync({
        id: resource.id,
        status: "INACTIVE",
      });
    });

    await waitFor(() =>
      expect(
        queryClient.getQueryData<ResourcePage>(queryKey)?.content[0].status,
      ).toBe("INACTIVE"),
    );

    await act(async () => {
      rejectStatus(new Error("Modification impossible"));
      await expect(mutation).rejects.toThrow("Modification impossible");
    });

    await waitFor(() =>
      expect(
        queryClient.getQueryData<ResourcePage>(queryKey)?.content[0].status,
      ).toBe("ACTIVE"),
    );
    expect(listResources).toHaveBeenCalledOnce();
    queryClient.clear();
  });
});
