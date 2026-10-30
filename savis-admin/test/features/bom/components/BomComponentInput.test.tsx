import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BomComponentInput } from "@/features/bom/components/BomComponentInput";
import type { BomComponent } from "@/features/bom/types";
import {
  getResource,
  listResources,
} from "@/features/resource/api/resourceApi";

vi.mock("@/features/resource/api/resourceApi", () => ({
  getResource: vi.fn(),
  listResources: vi.fn(),
}));
vi.mock("@/features/bom/hooks/useBomApi", () => ({
  useSearchAvailableOffers: () => ({ data: [], isFetching: false }),
}));

const resource = {
  id: "resource-uuid",
  name: "Farine de blé",
  description: null,
  category: "INGREDIENT" as const,
  referenceUnit: "g",
  status: "ACTIVE" as const,
};

function renderComponent(value: BomComponent, onChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <BomComponentInput value={value} onChange={onChange} onRemove={vi.fn()} />
    </QueryClientProvider>,
  );
  return onChange;
}

describe("BomComponentInput resource selector", () => {
  beforeEach(() => vi.clearAllMocks());

  it("searches active resources and selects identity and display name", async () => {
    vi.mocked(listResources).mockResolvedValue({
      content: [resource],
      totalElements: 1,
      page: 0,
      size: 20,
      totalPages: 1,
    });
    const onChange = renderComponent({
      resourceId: null,
      componentName: "",
      quantity: 200,
      unit: "g",
      selectedOfferId: "old-offer",
    });
    const input = screen.getByRole("combobox", {
      name: "Ressource du composant",
    });
    await userEvent.type(input, "farine");
    await userEvent.click(
      await screen.findByRole("option", { name: /Farine de blé/ }),
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceId: "resource-uuid",
        componentName: "Farine de blé",
        quantity: 200,
        unit: "g",
        selectedOfferId: null,
      }),
    );
    expect(listResources).toHaveBeenCalledWith("farine", 0, "ACTIVE");
  });

  it("keeps a referenced inactive resource visible and labels it as historical", async () => {
    vi.mocked(getResource).mockResolvedValue({
      ...resource,
      status: "INACTIVE",
    });
    renderComponent({
      resourceId: resource.id,
      componentName: "Ancien nom Supply",
      quantity: 2,
      unit: "kg",
      selectedOfferId: "kept-offer",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      /Ressource inactive/,
    );
    await waitFor(() => expect(getResource).toHaveBeenCalledWith(resource.id));
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Ressource du composant" }),
      ).toHaveValue(resource.name),
    );
  });
});
