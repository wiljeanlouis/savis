import { importRequests } from "@/features/sales/quote-requests/api/quoteRequestApi";
import type { ImportResult } from "@/features/sales/quote-requests/model/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { listSalesWorkspace } from "../api/workspaceApi";
import { salesWorkspaceDefaultPageSize } from "../model/workspacePresentation";

export function useSalesWorkspace() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const rawPage = Number(params.get("page") ?? 0);
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const rawSize = Number(params.get("size") ?? salesWorkspaceDefaultPageSize);
  const size =
    Number.isInteger(rawSize) && rawSize > 0
      ? rawSize
      : salesWorkspaceDefaultPageSize;
  const search = params.get("search") ?? "";
  const filter = (params.get("filter") ?? "ALL") as
    | "ALL"
    | "ACTION_REQUIRED"
    | "FINISHED";
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const query = useQuery({
    queryKey: ["sales", "workspace", { page, size, search, filter }],
    queryFn: () => listSalesWorkspace({ page, size, search, filter }),
  });

  const importer = useMutation({
    mutationFn: importRequests,
    onSuccess: async (result) => {
      setImportResult(result);
      await queryClient.invalidateQueries({ queryKey: ["sales", "workspace"] });
      await queryClient.invalidateQueries({ queryKey: ["quote-requests"] });
    },
  });

  function updateQueryParam(
    key: string,
    value: string | undefined,
    resetPage = true,
  ) {
    const next = new URLSearchParams(params);
    if (value && value.trim().length > 0) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (resetPage) next.delete("page");
    setParams(next);
  }

  function goToPage(nextPage: number) {
    updateQueryParam("page", String(Math.max(0, nextPage)), false);
  }

  function resetFilters() {
    setParams(new URLSearchParams());
  }

  function startImport() {
    setImportResult(null);
    importer.mutate();
  }

  return {
    page,
    size,
    search,
    filter,
    query,
    importer,
    importResult,
    updateQueryParam,
    goToPage,
    resetFilters,
    startImport,
  };
}
