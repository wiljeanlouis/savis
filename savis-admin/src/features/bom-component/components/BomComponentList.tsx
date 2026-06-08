import { NoData } from "@/shared/components/NoData";
import { PageSelector } from "@/shared/components/PageSelector";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { Spinner } from "@/shared/ui/spinner";
import { useBomComponentList } from "../hooks/useBomComponentList";
import { BomComponentCard } from "./BomComponentCard";
import { BomComponentSearchTermFacets } from "./BomComponentSearchTermFacets";
import { BomComponentListSorting } from "./BomComponentListSorting";
import { BomComponentRetrieveDialog } from "./BomComponentRetrieveDialog";

export const BomComponentList = () => {
  const {
    data,
    isLoading,
    isCreatingTask,
    isPatching,
    isDeleting,
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
  } = useBomComponentList();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Composants BOM</h1>
          <p className="text-sm text-muted-foreground">
            Un composant BOM est un élément utilisé dans la composition d'un
            BOM.
          </p>
        </div>
        <BomComponentRetrieveDialog
          isRetrieving={isCreatingTask}
          onRetrieve={handleRetrieve}
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <BomComponentSearchTermFacets
            selectedSearchTerm={listState.searchTerm}
            onSearchTermChange={handleSearchTermChange}
          />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <BomComponentListSorting
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
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {data.items.map((bomComponent) => (
                  <BomComponentCard
                    key={bomComponent.id}
                    bomComponent={bomComponent}
                    isPatching={isPatching}
                    isDeleting={isDeleting}
                    onPatch={handleQuickPatch}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              <PageNavigator
                itemName="composant BOM"
                totalItems={data.total_items}
                page={data.page}
                totalPages={data.total_pages}
                goToNextPage={goToNextPage}
                goToPreviousPage={goToPreviousPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};
