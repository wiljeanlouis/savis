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
  Ingredient,
  IngredientEditValues,
  IngredientStatus,
} from "../types";

interface IngredientEditDialogProps {
  ingredient: Ingredient;
  isPatching: boolean;
  onEdit: (ingredient: Ingredient, values: IngredientEditValues) => void;
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

export const IngredientEditDialog = ({
  ingredient,
  isPatching,
  onEdit,
}: IngredientEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<IngredientStatus>(ingredient.status);
  const [refreshFrequencyHours, setRefreshFrequencyHours] = useState(
    ingredient.refresh_frequency_hours,
  );
  const [refreshNow, setRefreshNow] = useState(false);

  const handleSubmit = () => {
    onEdit(ingredient, { status, refreshFrequencyHours, refreshNow });
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
          <DialogTitle>Modifier l'ingrédient</DialogTitle>
          <DialogDescription>{ingredient.label}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${ingredient.id}-status`}>Statut</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as IngredientStatus)}
            >
              <SelectTrigger id={`${ingredient.id}-status`} className="w-full">
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
            <Label htmlFor={`${ingredient.id}-refresh-frequency`}>
              Fréquence de refresh
            </Label>
            <Input
              id={`${ingredient.id}-refresh-frequency`}
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
              id={`${ingredient.id}-refresh-now`}
              checked={refreshNow}
              onCheckedChange={(checked) => setRefreshNow(checked === true)}
            />
            <Label htmlFor={`${ingredient.id}-refresh-now`}>
              Lancer un refresh maintenant
            </Label>
          </div>
          <div className="grid gap-1 text-xs text-muted-foreground">
            <div>Provider: {ingredient.provider.name}</div>
            <div>Dernier task: {ingredient.last_seen_task_id}</div>
            <div>
              Prochain refresh: {formatDate(ingredient.next_refresh_at)}
            </div>
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
