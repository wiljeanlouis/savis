import type { CatalogProduct } from "@/features/catalog/types";
import { CatalogProductDropdown } from "@/features/sales/orders/components/CatalogProductDropdown";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

describe("CatalogProductDropdown", () => {
  it("filters through the search callback and selects a server result", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onSelect = vi.fn();
    const product = {
      id: "product-id",
      code: "COOKIE",
      name: "Biscuit personnalisé",
      commercialType: "SERVICE",
    } as CatalogProduct;

    function TestDropdown() {
      const [search, setSearch] = useState("");
      return (
        <CatalogProductDropdown
          products={[product]}
          search={search}
          isLoading={false}
          isError={false}
          onSearchChange={(value) => {
            setSearch(value);
            onSearchChange(value);
          }}
          onSelect={onSelect}
        />
      );
    }

    render(<TestDropdown />);

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByRole("textbox", { name: /rechercher/i }),
      "bis",
    );
    expect(onSearchChange).toHaveBeenLastCalledWith("bis");

    await user.click(
      screen.getByRole("button", { name: /biscuit personnalisé/i }),
    );
    expect(onSelect).toHaveBeenCalledWith(product);
  });
});
