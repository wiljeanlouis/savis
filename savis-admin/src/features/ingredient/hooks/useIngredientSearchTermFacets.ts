import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useGetIngredientSearchTermFacets } from "./useIngredientApi";

interface UseIngredientSearchTermFacetsParams {
  selectedSearchTerm?: string;
  onSearchTermChange: (searchTerm: string | undefined) => void;
}

export const useIngredientSearchTermFacets = ({
  selectedSearchTerm,
  onSearchTermChange,
}: UseIngredientSearchTermFacetsParams) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: facets, isError, error } = useGetIngredientSearchTermFacets();

  useEffect(() => {
    if (!isError) {
      return;
    }

    const errorResponse = error as unknown as {
      response?: { data?: { detail?: string } };
    };

    toast.error(
      "Une erreur est survenue lors de la récupération des facettes.",
      {
        description: errorResponse.response?.data?.detail,
      },
    );
  }, [error, isError]);

  const totalCount = useMemo(() => {
    return facets?.reduce((total, facet) => total + facet.count, 0) ?? 0;
  }, [facets]);

  const selectedFacet = useMemo(() => {
    return facets?.find((facet) => facet.search_term === selectedSearchTerm);
  }, [facets, selectedSearchTerm]);

  const filteredFacets = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    if (!normalizedSearchQuery) {
      return facets ?? [];
    }

    return (
      facets?.filter((facet) =>
        facet.search_term.toLowerCase().includes(normalizedSearchQuery),
      ) ?? []
    );
  }, [facets, searchQuery]);

  return {
    facets,
    filteredFacets,
    searchQuery,
    selectedSearchTerm,
    selectedFacet,
    totalCount,
    onSearchTermChange,
    setSearchQuery,
  };
};
