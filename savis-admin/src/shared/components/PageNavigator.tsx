import { Button } from "@/shared/ui/button";
import { PageSelector } from "@/shared/components/PageSelector";

interface PageNavigatorProps {
  page: number;
  totalPages: number;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export const PageNavigator = ({
  page,
  totalPages,
  goToPreviousPage,
  goToNextPage,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
}: PageNavigatorProps) => {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousPage}
          disabled={page <= 1}
        >
          Précédent
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {page} sur {safeTotalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={page >= safeTotalPages}
        >
          Suivant
        </Button>
      </div>

      {typeof pageSize === "number" && onPageSizeChange ? (
        <PageSelector
          pageSize={pageSize}
          onPageChange={onPageSizeChange}
          options={pageSizeOptions}
        />
      ) : null}
    </div>
  );
};
