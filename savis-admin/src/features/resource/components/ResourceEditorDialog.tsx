import type { ComponentProps } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ResourceEditor } from "./ResourceEditor";

export function ResourceEditorDialog(
  props: ComponentProps<typeof ResourceEditor>,
) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !props.saving) props.onCancel();
      }}
    >
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        showCloseButton={!props.saving}
      >
        <DialogHeader>
          <DialogTitle>
            {props.resource ? "Modifier la ressource" : "Nouvelle ressource"}
          </DialogTitle>
          <DialogDescription>
            Renseignez le nom, la catégorie et l’unité de référence de la
            ressource.
          </DialogDescription>
        </DialogHeader>
        <ResourceEditor {...props} />
      </DialogContent>
    </Dialog>
  );
}
