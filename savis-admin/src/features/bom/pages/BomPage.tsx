import { BomForm } from "@/features/bom/components/BomForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useLoaderData, useNavigate } from "react-router";
import type { Bom } from "../types";

export const BomPage = () => {
  const bom = useLoaderData<Bom | null>();
  const navigate = useNavigate();
  const isEditing = Boolean(bom?.id);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          void navigate("/boms");
        }
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le BOM" : "Ajouter un nouveau BOM"}
          </DialogTitle>
          <DialogDescription>
            Définissez les informations générales, les composants et les
            activités nécessaires à ce BOM.
          </DialogDescription>
        </DialogHeader>
        <BomForm showTitle={false} />
      </DialogContent>
    </Dialog>
  );
};
