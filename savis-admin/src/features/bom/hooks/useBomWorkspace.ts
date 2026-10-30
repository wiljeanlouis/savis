import { useEffect } from "react";
import { useSearchParams } from "react-router";
import type { Bom } from "../types";
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
export function useBomWorkspace(boms?: Bom[]) {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const size = [10, 20, 30, 50].includes(Number(params.get("size")))
    ? Number(params.get("size"))
    : 10;
  const filtered = (boms ?? [])
    .filter((b) =>
      normalize(
        [
          b.name,
          b.description,
          b.instructions,
          ...b.components.map((c) => c.componentName),
        ].join(" "),
      ).includes(normalize(search.trim())),
    )
    .filter((bom) => {
      const type = params.get("type");
      const activity = params.get("activity");
      return (
        (!type || type === "ALL" || bom.type === type) &&
        (!activity ||
          activity === "ALL" ||
          (activity === "NONE"
            ? bom.activities.length === 0
            : bom.activities.some((item) => item.type === activity)))
      );
    })
    .sort((a, b) => {
      const sort = params.get("sort") ?? "asc";
      const column = sort.split("-")[0];
      const order = sort === "desc" || sort.endsWith("-desc") ? -1 : 1;
      const comparison =
        column === "type"
          ? a.type.localeCompare(b.type)
          : column === "unit"
            ? a.yield.unit.localeCompare(b.yield.unit, "fr")
            : column === "components"
              ? a.components.length - b.components.length
              : column === "activities"
                ? a.activities.length - b.activities.length
                : a.name.localeCompare(b.name, "fr");
      return order * comparison || (a.id ?? "").localeCompare(b.id ?? "");
    });
  useEffect(() => {
    if (!params.has("components") && !params.has("unit")) return;
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("components");
        next.delete("unit");
        return next;
      },
      { replace: true },
    );
  }, [params, setParams]);
  useEffect(() => {
    const selectedId = params.get("selected");
    if (!boms || !selectedId || filtered.some((bom) => bom.id === selectedId))
      return;
    setParams(
      (previous) => {
        if (previous.get("selected") !== selectedId) return previous;
        const next = new URLSearchParams(previous);
        next.delete("selected");
        return next;
      },
      { replace: true },
    );
  }, [boms, filtered, params, setParams]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const rawPage = Number(params.get("page"));
  const selectedIndex = filtered.findIndex(
    (bom) => bom.id === params.get("selected"),
  );
  const page =
    selectedIndex >= 0
      ? Math.floor(selectedIndex / size) + 1
      : Math.min(
          totalPages,
          Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
        );
  const items = filtered.slice((page - 1) * size, page * size);
  const selected = filtered.find((b) => b.id === params.get("selected"));
  const update = (key: string, value: string, reset = true) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      if (reset) {
        if (key !== "page") next.delete("page");
        next.delete("selected");
      }
      return next;
    });
  };
  const reset = () => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const key of [
        "type",
        "unit",
        "activity",
        "components",
        "page",
        "selected",
      ])
        next.delete(key);
      return next;
    });
  };
  return {
    reset,
    params,
    search,
    size,
    filtered,
    totalPages,
    page,
    items,
    selected,
    showList: () =>
      setParams((previous) => {
        const next = new URLSearchParams(previous);
        next.delete("selected");
        return next;
      }),
    update,
  };
}
