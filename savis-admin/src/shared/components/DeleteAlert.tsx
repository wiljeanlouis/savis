import {
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialog,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

interface DeleteAlertProps {
  item: string;
  onDelete: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export const DeleteAlert = ({
  item,
  onDelete,
  open,
  onOpenChange,
  hideTrigger = false,
}: DeleteAlertProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Supprimer</Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Alerte de suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Voulez-vous supprimer <span className="font-bold">{item}</span> ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Non</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Oui</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
