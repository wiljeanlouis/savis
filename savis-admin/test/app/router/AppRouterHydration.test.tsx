import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const { getBom } = vi.hoisted(() => ({ getBom: vi.fn() }));

vi.mock("@/features/bom/api/bomApi", () => ({ getBom }));
vi.mock("@/app/layout/MainLayout", async () => {
  const { Outlet } = await import("react-router");
  return { MainLayout: () => <Outlet /> };
});
vi.mock("@/features/bom/pages/BomPage", async () => {
  const { useLoaderData } = await import("react-router");
  return {
    BomPage: () => {
      const bom = useLoaderData() as { name: string };
      return <h1>{bom.name}</h1>;
    },
  };
});

let resolveBom: (bom: { name: string }) => void;
const pending = new Promise<{ name: string }>((resolve) => {
  resolveBom = resolve;
});
getBom.mockReturnValue(pending);
window.history.replaceState(null, "", "/boms/bom-123");
const { AppRouter } = await import("@/app/router/AppRouter");

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

it("shows an initial loading status until a directly opened BOM is loaded", async () => {
  render(<AppRouter />);

  expect(screen.getByRole("status")).toHaveTextContent("Chargement…");
  expect(getBom).toHaveBeenCalledWith("bom-123");

  await act(async () => {
    resolveBom({ name: "Composition chargée" });
    await pending;
  });

  expect(
    await screen.findByRole("heading", { name: "Composition chargée" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
