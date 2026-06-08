import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Settings05Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import type {
  BomComponent,
  BomComponentEditValues,
  BomComponentStatus,
} from "../types";

interface BomComponentEditDialogProps {
  bomComponent: BomComponent;
  isPatching: boolean;
  onEdit: (bomComponent: BomComponent, values: BomComponentEditValues) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

interface BomComponentEditFormProps {
  bomComponent: BomComponent;
  isPatching: boolean;
  onSubmit: (values: BomComponentEditValues) => void;
}

const BomComponentEditForm = ({
  bomComponent,
  isPatching,
  onSubmit,
}: BomComponentEditFormProps) => {
  const [status, setStatus] = useState<BomComponentStatus>(bomComponent.status);
  const [refreshFrequencyHours, setRefreshFrequencyHours] = useState(
    bomComponent.refresh_frequency_hours,
  );
  const [refreshNow, setRefreshNow] = useState(false);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Modifier le composant BOM</DialogTitle>
        <DialogDescription>{bomComponent.label}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${bomComponent.id}-status`}>Statut</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as BomComponentStatus)}
          >
            <SelectTrigger id={`${bomComponent.id}-status`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="NEW">Nouveau</SelectItem>
                <SelectItem value="VALID">Valide</SelectItem>
                <SelectItem value="REJECTED">Rejeté</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${bomComponent.id}-refresh-frequency`}>
            Fréquence d'actualisation
          </Label>
          <Input
            id={`${bomComponent.id}-refresh-frequency`}
            type="number"
            min={1}
            value={refreshFrequencyHours}
            onChange={(event) =>
              setRefreshFrequencyHours(Number(event.target.value))
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${bomComponent.id}-refresh-now`}
            checked={refreshNow}
            onCheckedChange={(checked) => setRefreshNow(checked === true)}
          />
          <Label htmlFor={`${bomComponent.id}-refresh-now`}>
            Lancer une actualisation maintenant
          </Label>
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground">
          <div>Fournisseur : {bomComponent.provider.name}</div>
          <div>Dernière tâche : {bomComponent.last_seen_task_id}</div>
          <div>
            Prochaine actualisation : {formatDate(bomComponent.next_refresh_at)}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          onClick={() =>
            onSubmit({ status, refreshFrequencyHours, refreshNow })
          }
          disabled={isPatching || refreshFrequencyHours < 1}
        >
          Enregistrer
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const BomComponentEditDialog = ({
  bomComponent,
  isPatching,
  onEdit,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: BomComponentEditDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (nextOpen: boolean) => {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
            <span className="sr-only">Modifier</span>
          </Button>
        </DialogTrigger>
      )}
      {open && (
        <BomComponentEditForm
          bomComponent={bomComponent}
          isPatching={isPatching}
          onSubmit={(values) => {
            onEdit(bomComponent, values);
            setOpen(false);
          }}
        />
      )}
    </Dialog>
  );
};
