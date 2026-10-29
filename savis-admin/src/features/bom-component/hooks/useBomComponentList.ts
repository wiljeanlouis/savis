import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/api/apiError";
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
  status: BomComponentStatus | "ALL";
}

const initialListState: BomComponentListState = {
  status: "NEW",
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
    sortBy: [
      "last_retrieved_at",
      "label",
      "brand",
      "price",
      "package_size",
      "provider",
      "search_term",
      "status",
      "next_refresh_at",
    ].includes(searchParams.get("sort_by") ?? "")
      ? searchParams.get("sort_by")!
      : initialListState.sortBy,
    sortDirection: parseSortDirection(searchParams.get("sort_direction")),
    searchTerm,
    status: ["NEW", "VALID", "REJECTED", "ALL"].includes(
      searchParams.get("status") ?? "",
    )
      ? (searchParams.get("status") as BomComponentStatus | "ALL")
      : "NEW",
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
  nextSearchParams.set("status", listState.status);

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

  const { data, isPending, isError, error, refetch, isFetching } =
    useGetBomComponents(
      listState.page,
      listState.pageSize,
      listState.sortBy,
      listState.sortDirection,
      listState.searchTerm,
      listState.status === "ALL" ? undefined : listState.status,
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

    toast.error(
      "Une erreur est survenue lors de la récupération des offres fournisseurs.",
      {
        description: getApiErrorMessage(error),
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

  useEffect(() => {
    if (data && data.page > Math.max(1, data.total_pages)) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("page", String(Math.max(1, data.total_pages)));
          return next;
        },
        { replace: true },
      );
    }
  }, [data, setSearchParams]);

  const handleStatusChange = (status: BomComponentStatus | "ALL") => {
    updateListState((current) => ({ ...current, page: 1, status }));
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
        onSuccess: () => toast.success(`Offre fournisseur ${action}.`),
        onError: (error) =>
          toast.error("La mise à jour de l'offre fournisseur a échoué.", {
            description: getApiErrorMessage(error),
          }),
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
      } catch (error) {
        toast.error("La mise à jour de l'offre fournisseur a échoué.", {
          description: getApiErrorMessage(error),
        });
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
            ? "Offre fournisseur mise à jour et actualisation lancée."
            : "Offre fournisseur mise à jour.",
        );
      } catch (error) {
        toast.error(
          "L'offre fournisseur est mise à jour, mais l'actualisation a échoué.",
          { description: getApiErrorMessage(error) },
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
    } catch (error) {
      toast.error(
        `Impossible de lancer la récupération pour « ${searchTerm} ».`,
        { description: getApiErrorMessage(error) },
      );
      return false;
    }
  };

  const handleDelete = (bomComponent: BomComponent) => {
    deleteBomComponent.mutate(bomComponent.id, {
      onSuccess: () => toast.success("Offre fournisseur supprimée."),
      onError: (error) =>
        toast.error("La suppression de l'offre fournisseur a échoué.", {
          description: getApiErrorMessage(error),
        }),
    });
  };

  return {
    data,
    isError,
    error,
    refetch,
    isFetching,
    handleStatusChange,
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
