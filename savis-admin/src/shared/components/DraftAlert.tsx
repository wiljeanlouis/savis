import {
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialog,
} from "@/shared/ui/alert-dialog";

interface DraftAlertProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onDelete: () => void;
  onKeep: () => void;
}

export const DraftAlert = ({
  isOpen,
  setIsOpen,
  onDelete,
  onKeep,
}: DraftAlertProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Il y a un brouillon non enregistré
          </AlertDialogTitle>
          <AlertDialogDescription>
            Voulez-vous supprimer ce brouillon ou le garder pour le modifier
            plus tard ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDelete}>Supprimer</AlertDialogCancel>
          <AlertDialogAction onClick={onKeep}>Garder</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
