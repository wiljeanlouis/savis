import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import type {
  Ingredient,
  IngredientEditValues,
  IngredientStatus,
} from "../types";
import { useGetIngredients, usePatchIngredient } from "./useIngredientApi";

type SortDirection = "asc" | "desc";

interface IngredientListState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: SortDirection;
  searchTerm?: string;
}

const initialListState: IngredientListState = {
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

const parseListState = (searchParams: URLSearchParams): IngredientListState => {
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
  listState: IngredientListState,
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

export const useIngredientList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const listState = useMemo(() => parseListState(searchParams), [searchParams]);

  const { data, isPending, isError, error } = useGetIngredients(
    listState.page,
    listState.pageSize,
    listState.sortBy,
    listState.sortDirection,
    listState.searchTerm,
  );
  const patchIngredient = usePatchIngredient();

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
      "Une erreur est survenue lors de la récupération des ingrédients.",
      {
        description: errorResponse.response?.data?.detail,
      },
    );
  }, [error, isError]);

  const updateListState = (
    getNextListState: (
      currentListState: IngredientListState,
    ) => IngredientListState,
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
    ingredient: Ingredient,
    status: IngredientStatus,
  ) => {
    const action =
      status === "VALID"
        ? "validée"
        : ingredient.status === "VALID"
          ? "invalidée"
          : "rejetée";

    patchIngredient.mutate(
      { id: ingredient.id, payload: { status } },
      {
        onSuccess: () => toast.success(`Ingrédient ${action}.`),
        onError: () => toast.error("La mise à jour de l'ingrédient a échoué."),
      },
    );
  };

  const handleEdit = (ingredient: Ingredient, values: IngredientEditValues) => {
    patchIngredient.mutate(
      {
        id: ingredient.id,
        payload: {
          status: values.status,
          refresh_frequency_hours: values.refreshFrequencyHours,
          refresh_now: values.refreshNow,
        },
      },
      {
        onSuccess: () => toast.success("Ingrédient mis à jour."),
        onError: () => toast.error("La mise à jour de l'ingrédient a échoué."),
      },
    );
  };

  return {
    data,
    isLoading: isPending,
    isPatching: patchIngredient.isPending,
    listState,
    handleEdit,
    handlePageSizeChange,
    handleQuickPatch,
    handleSearchTermChange,
    handleSortByChange,
    goToNextPage,
    goToPreviousPage,
    toggleSortDirection,
  };
};
