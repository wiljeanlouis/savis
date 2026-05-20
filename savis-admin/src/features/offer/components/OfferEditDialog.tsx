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
import type { Offer, OfferStatus } from "../types";

export interface OfferEditValues {
  status: OfferStatus;
  refreshFrequencyHours: number;
  refreshNow: boolean;
}

interface OfferEditDialogProps {
  offer: Offer;
  isPatching: boolean;
  onEdit: (offer: Offer, values: OfferEditValues) => void;
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

export const OfferEditDialog = ({
  offer,
  isPatching,
  onEdit,
}: OfferEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<OfferStatus>(offer.status);
  const [refreshFrequencyHours, setRefreshFrequencyHours] = useState(
    offer.refresh_frequency_hours,
  );
  const [refreshNow, setRefreshNow] = useState(false);

  const handleSubmit = () => {
    onEdit(offer, { status, refreshFrequencyHours, refreshNow });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
          <span className="sr-only">Modifier</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'offre</DialogTitle>
          <DialogDescription>{offer.label}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${offer.id}-status`}>Statut</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as OfferStatus)}
            >
              <SelectTrigger id={`${offer.id}-status`} className="w-full">
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
            <Label htmlFor={`${offer.id}-refresh-frequency`}>
              Fréquence de refresh
            </Label>
            <Input
              id={`${offer.id}-refresh-frequency`}
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
              id={`${offer.id}-refresh-now`}
              checked={refreshNow}
              onCheckedChange={(checked) => setRefreshNow(checked === true)}
            />
            <Label htmlFor={`${offer.id}-refresh-now`}>
              Lancer un refresh maintenant
            </Label>
          </div>
          <div className="grid gap-1 text-xs text-muted-foreground">
            <div>Provider: {offer.provider.name}</div>
            <div>Dernier task: {offer.last_seen_task_id}</div>
            <div>Prochain refresh: {formatDate(offer.next_refresh_at)}</div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPatching || refreshFrequencyHours < 1}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
