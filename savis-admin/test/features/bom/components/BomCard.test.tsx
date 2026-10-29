import { BomCard } from "@/features/bom/components/BomCard";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { bom, missingCosting } from "../fixtures/costing";

function renderCard(costing = bom.costing) {
  const cloneBom = vi.fn();
  const deleteBom = vi.fn();
  const result = render(
    <MemoryRouter>
      <BomCard
        bom={{ ...bom, costing }}
        cloneBom={cloneBom}
        deleteBom={deleteBom}
      />
    </MemoryRouter>,
  );
  return { ...result, cloneBom, deleteBom };
}

describe("BomCard", () => {
  it("shows composition information and editing without cost information", () => {
    const { container } = renderCard();
    expect(screen.getByRole("img", { name: bom.name })).toBeVisible();
    expect(screen.getByText(bom.description)).toBeVisible();
    expect(screen.getByText("4 portion")).toBeVisible();
    expect(
      screen.queryByText(/coût|sous-total|analyse/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
      "href",
      "/boms/bom-1",
    );
    expect(container.querySelector("details")).toBeNull();
    expect(container).not.toHaveTextContent(
      bom.costing!.components[0].source!.usedOfferId!,
    );
    expect(container).not.toHaveTextContent(
      bom.costing!.components[0].source!.observedAt!,
    );
    expect(screen.queryByText("Farine")).not.toBeInTheDocument();
  });

  it("does not show costs even when a cached BOM contains an incomplete valuation", () => {
    const { container } = renderCard(missingCosting);
    expect(
      screen.queryByText(/coût|sous-total|analyse/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Taux horaire absent")).not.toBeInTheDocument();
    expect(container.querySelector("details")).toBeNull();
  });

  it("preserves cloning and confirmed deletion", async () => {
    const { cloneBom, deleteBom } = renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Cloner" }));
    expect(cloneBom).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Supprimer" }));
    expect(deleteBom).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Oui" }));
    expect(deleteBom).toHaveBeenCalledOnce();
  });
});
