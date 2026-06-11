import { BomComponentCard } from "@/features/bom-component/components/BomComponentCard";
import type { BomComponent } from "@/features/bom-component/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const bomComponent: BomComponent = {
  id: "offer-1",
  external_id: "external-1",
  url: "https://www.maxi.ca/product/p/12345",
  brand: "Natrel",
  label: "Produit laitier",
  price: null,
  package_size: null,
  image_url: "",
  provider: {
    name: "Maxi",
    identifier: "8772",
    site: "https://www.maxi.ca",
    address: "Drummondville",
  },
  search_term: "lait",
  status: "NEW",
  type: "FOOD",
  last_retrieved_at: "2026-06-11T12:00:00Z",
  next_refresh_at: "2026-06-12T12:00:00Z",
  refresh_frequency_hours: 24,
  last_seen_task_id: "task-1",
};

describe("BomComponentCard", () => {
  it("renders a placeholder instead of an image with an empty source", () => {
    render(
      <BomComponentCard
        bomComponent={bomComponent}
        isPatching={false}
        isDeleting={false}
        onPatch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByRole("img", { name: bomComponent.label })).toBeNull();
    expect(
      screen.getByRole("img", {
        name: `Image indisponible pour ${bomComponent.label}`,
      }),
    ).toBeInTheDocument();
  });
});
