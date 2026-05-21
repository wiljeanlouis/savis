import { Button } from "@/shared/ui/button";

interface PageNavigatorProps {
  itemName: string;
  totalItems: number;
  page: number;
  totalPages: number;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
}

export const PageNavigator = ({
  itemName,
  totalItems,
  page,
  totalPages,
  goToPreviousPage,
  goToNextPage,
}: PageNavigatorProps) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="text-xs text-muted-foreground">
        {totalItems} {itemName}
        {totalPages > 1 ? "s" : ""}
      </p>
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousPage}
          disabled={page <= 1}
        >
          Précédent
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {page} sur {Math.max(totalPages, 1)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={page >= totalPages}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
};
