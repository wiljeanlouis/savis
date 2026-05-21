import { NoData } from "@/shared/components/NoData";
import { PageSelector } from "@/shared/components/PageSelector";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { Spinner } from "@/shared/ui/spinner";
import { useIngredientList } from "../hooks/useIngredientList";
import { IngredientCard } from "./IngredientCard";
import { IngredientSearchTermFacets } from "./IngredientSearchTermFacets";
import { IngredientListSorting } from "./IngredientListSorting";

export const IngredientList = () => {
  const {
    data,
    isLoading,
    isPatching,
    listState,
    handleEdit,
    handlePageSizeChange,
    handleQuickPatch,
    handleSearchTermChange,
    handleSortByChange,
    goToNextPage,
    goToPreviousPage,
    toggleSortDirection,
  } = useIngredientList();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return <NoData />;
  }

  return (
    <div className="space-y-4">
      <IngredientSearchTermFacets
        selectedSearchTerm={listState.searchTerm}
        onSearchTermChange={handleSearchTermChange}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <IngredientListSorting
            sortBy={listState.sortBy}
            handleSortByChange={handleSortByChange}
            toggleSortDirection={toggleSortDirection}
            sortDirection={listState.sortDirection}
          />
        </div>
        <div className="flex items-center gap-2">
          <PageSelector
            pageSize={listState.pageSize}
            onPageChange={handlePageSizeChange}
          />
        </div>
      </div>

      {!data?.items.length ? (
        <NoData />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {data.items.map((ingredient) => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              isPatching={isPatching}
              onPatch={handleQuickPatch}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <PageNavigator
        itemName="ingrédient"
        totalItems={data.total_items}
        page={data.page}
        totalPages={data.total_pages}
        goToNextPage={goToNextPage}
        goToPreviousPage={goToPreviousPage}
      />
    </div>
  );
};
