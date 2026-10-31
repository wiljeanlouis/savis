import { Button } from "@/shared/ui/button";

interface PageNavigatorProps {
  page: number;
  totalPages: number;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
}

export const PageNavigator = ({
  page,
  totalPages,
  goToPreviousPage,
  goToNextPage,
}: PageNavigatorProps) => {
  return (
    <div className="flex justify-end">
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
