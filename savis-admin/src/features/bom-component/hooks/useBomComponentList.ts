import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { useCreateBomComponentTask } from "@/features/bom-component/task/hooks/useBomComponentTaskApi";
import type {
  BomComponent,
  BomComponentEditValues,
  BomComponentRetrievalValues,
  BomComponentStatus,
} from "../types";
import {
  useDeleteBomComponent,
  useGetBomComponents,
  usePatchBomComponent,
} from "./useBomComponentApi";

type SortDirection = "asc" | "desc";

interface BomComponentListState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: SortDirection;
  searchTerm?: string;
}

const initialListState: BomComponentListState = {
  page: 1,
  pageSize: 20,
  sortBy: "last_retrieved_at",
  sortDirection: "desc",
};

const parsePositiveInteger = (value: string | null, fallback: number) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
};

const parseSortDirection = (value: string | null): SortDirection => {
  return value === "asc" || value === "desc"
    ? value
    : initialListState.sortDirection;
};

const parseListState = (
  searchParams: URLSearchParams,
): BomComponentListState => {
  const rawSearchTerm = searchParams.get("search_term")?.trim();
  const searchTerm = rawSearchTerm === "" ? undefined : rawSearchTerm;

  return {
    page: parsePositiveInteger(searchParams.get("page"), initialListState.page),
    pageSize: parsePositiveInteger(
      searchParams.get("size"),
      initialListState.pageSize,
    ),
    sortBy: searchParams.get("sort_by") ?? initialListState.sortBy,
    sortDirection: parseSortDirection(searchParams.get("sort_direction")),
    searchTerm,
  };
};

const createSearchParamsFromListState = (
  listState: BomComponentListState,
  currentSearchParams: URLSearchParams,
) => {
  const nextSearchParams = new URLSearchParams(currentSearchParams);

  nextSearchParams.set("page", `${listState.page}`);
  nextSearchParams.set("size", `${listState.pageSize}`);
  nextSearchParams.set("sort_by", listState.sortBy);
  nextSearchParams.set("sort_direction", listState.sortDirection);
  nextSearchParams.delete("type");

  if (listState.searchTerm) {
    nextSearchParams.set("search_term", listState.searchTerm);
  } else {
    nextSearchParams.delete("search_term");
  }

  return nextSearchParams;
};

export const useBomComponentList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const listState = useMemo(() => parseListState(searchParams), [searchParams]);

  const { data, isPending, isError, error } = useGetBomComponents(
    listState.page,
    listState.pageSize,
    listState.sortBy,
    listState.sortDirection,
    listState.searchTerm,
  );
  const patchBomComponent = usePatchBomComponent();
  const deleteBomComponent = useDeleteBomComponent();
  const createTask = useCreateBomComponentTask();

  useEffect(() => {
    const nextSearchParams = createSearchParamsFromListState(
      listState,
      searchParams,
    );

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [listState, searchParams, setSearchParams]);

  useEffect(() => {
    if (!isError) {
      return;
    }

    const errorResponse = error as unknown as {
      response?: { data?: { detail?: string } };
    };

    toast.error(
      "Une erreur est survenue lors de la récupération des composants BOM.",
      {
        description: errorResponse.response?.data?.detail,
      },
    );
  }, [error, isError]);

  const updateListState = (
    getNextListState: (
      currentListState: BomComponentListState,
    ) => BomComponentListState,
  ) => {
    setSearchParams((currentSearchParams) => {
      const nextListState = getNextListState(
        parseListState(currentSearchParams),
      );

      return createSearchParamsFromListState(
        nextListState,
        currentSearchParams,
      );
    });
  };

  const handlePageSizeChange = (size: number) => {
    updateListState((current) => ({
      ...current,
      page: 1,
      pageSize: size,
    }));
  };

  const handleSortByChange = (value: string) => {
    updateListState((current) => ({
      ...current,
      page: 1,
      sortBy: value,
    }));
  };

  const toggleSortDirection = () => {
    updateListState((current) => ({
      ...current,
      page: 1,
      sortDirection: current.sortDirection === "asc" ? "desc" : "asc",
    }));
  };

  const handleSearchTermChange = (nextSearchTerm: string | undefined) => {
    updateListState((current) => ({
      ...current,
      page: 1,
      searchTerm: nextSearchTerm,
    }));
  };

  const goToPreviousPage = () => {
    updateListState((current) => ({
      ...current,
      page: Math.max(current.page - 1, 1),
    }));
  };

  const goToNextPage = () => {
    updateListState((current) => ({
      ...current,
      page: Math.min(current.page + 1, data?.total_pages ?? current.page),
    }));
  };

  const handleQuickPatch = (
    bomComponent: BomComponent,
    status: BomComponentStatus,
  ) => {
    const action =
      status === "VALID"
        ? "validé"
        : bomComponent.status === "VALID"
          ? "invalidé"
          : "rejeté";

    patchBomComponent.mutate(
      { id: bomComponent.id, payload: { status } },
      {
        onSuccess: () => toast.success(`Composant BOM ${action}.`),
        onError: () => toast.error("La mise à jour du composant BOM a échoué."),
      },
    );
  };

  const handleEdit = (
    bomComponent: BomComponent,
    values: BomComponentEditValues,
  ) => {
    void (async () => {
      try {
        await patchBomComponent.mutateAsync({
          id: bomComponent.id,
          payload: {
            status: values.status,
            refresh_frequency_hours: values.refreshFrequencyHours,
          },
        });
      } catch {
        toast.error("La mise à jour du composant BOM a échoué.");
        return;
      }

      try {
        if (values.refreshNow) {
          await createTask.mutateAsync({
            type: "REFRESH_OFFER",
            payload: {
              offer_id: bomComponent.id,
              url: bomComponent.url,
            },
          });
        }
        toast.success(
          values.refreshNow
            ? "Composant BOM mis à jour et refresh lancé."
            : "Composant BOM mis à jour.",
        );
      } catch {
        toast.error(
          "Le composant BOM est mis à jour, mais le refresh a échoué.",
        );
      }
    })();
  };

  const handleRetrieve = async (values: BomComponentRetrievalValues) => {
    const searchTerm = values.searchTerm.trim();
    const url = values.url.trim();
    if (!searchTerm || !url) {
      return false;
    }

    try {
      await createTask.mutateAsync({
        type: "GET_OFFER",
        payload: {
          search_term: searchTerm,
          type: values.type,
          provider: values.provider,
          url,
        },
      });
      toast.success(`Récupération lancée pour « ${searchTerm} ».`);
      return true;
    } catch {
      toast.error(
        `Impossible de lancer la récupération pour « ${searchTerm} ».`,
      );
      return false;
    }
  };

  const handleDelete = (bomComponent: BomComponent) => {
    deleteBomComponent.mutate(bomComponent.id, {
      onSuccess: () => toast.success("Composant BOM supprimé."),
      onError: () => toast.error("La suppression du composant BOM a échoué."),
    });
  };

  return {
    data,
    isLoading: isPending,
    isCreatingTask: createTask.isPending,
    isPatching: patchBomComponent.isPending || createTask.isPending,
    isDeleting: deleteBomComponent.isPending,
    listState,
    handleDelete,
    handleEdit,
    handlePageSizeChange,
    handleQuickPatch,
    handleRetrieve,
    handleSearchTermChange,
    handleSortByChange,
    goToNextPage,
    goToPreviousPage,
    toggleSortDirection,
  };
};
