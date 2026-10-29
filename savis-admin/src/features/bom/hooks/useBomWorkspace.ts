import { useState } from "react";
import { useSearchParams } from "react-router";
import type { Bom } from "../types";
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
export function useBomWorkspace(boms?: Bom[]) {
  const [params, setParams] = useSearchParams();
  const [mobileDetail, setMobileDetail] = useState(params.has("selected"));
  const search = params.get("search") ?? "";
  const size = [10, 20, 30, 50].includes(Number(params.get("size")))
    ? Number(params.get("size"))
    : 10;
  const units = [
    ...new Set((boms ?? []).map((bom) => bom.yield.unit).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "fr"));
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
      const unit = params.get("unit");
      const activity = params.get("activity");
      const components = params.get("components");
      return (
        (!type || type === "ALL" || bom.type === type) &&
        (!unit || unit === "ALL" || bom.yield.unit === unit) &&
        (!activity ||
          activity === "ALL" ||
          (activity === "NONE"
            ? bom.activities.length === 0
            : bom.activities.some((item) => item.type === activity))) &&
        (!components ||
          components === "ALL" ||
          (components === "WITH"
            ? bom.components.length > 0
            : components === "WITHOUT"
              ? bom.components.length === 0
              : true))
      );
    })
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name, "fr") *
        (params.get("sort") === "desc" ? -1 : 1),
    );
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
  const selected =
    filtered.find((b) => b.id === params.get("selected")) ?? items[0];
  const mobile = mobileDetail && !!selected;
  const update = (key: string, value: string, reset = true) => {
    setMobileDetail(key === "selected");
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
    setMobileDetail(false);
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const key of [
        "search",
        "type",
        "unit",
        "activity",
        "components",
        "sort",
        "page",
        "selected",
      ])
        next.delete(key);
      return next;
    });
  };
  return {
    units,
    reset,
    params,
    search,
    size,
    filtered,
    totalPages,
    page,
    items,
    selected,
    mobile,
    showList: () => setMobileDetail(false),
    update,
  };
}
