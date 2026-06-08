import { Button } from "@/shared/ui/button";
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
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import type { ActivityRate, ActivityRateValues, ActivityType } from "../types";
import { activityTypeLabel, activityTypes } from "../types";

interface ActivityRateDialogProps {
  activityRate?: ActivityRate;
  activityRates: ActivityRate[];
  isSaving: boolean;
  onSave: (values: ActivityRateValues) => void;
}

const defaultValues: ActivityRateValues = {
  activityType: "PREP",
  hourlyRateAmount: 0,
  currency: "CAD",
};

export const ActivityRateDialog = ({
  activityRate,
  activityRates,
  isSaving,
  onSave,
}: ActivityRateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ActivityRateValues>(defaultValues);
  const isEditing = Boolean(activityRate);
  const configuredTypes = new Set(
    activityRates
      .filter((rate) => rate.activityType !== activityRate?.activityType)
      .map((rate) => rate.activityType),
  );
  const firstAvailableType = activityTypes.find(
    (type) => !configuredTypes.has(type.value),
  )?.value;

  useEffect(() => {
    if (!open) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect, react-x/set-state-in-effect
    setValues(
      activityRate
        ? {
            activityType: activityRate.activityType,
            hourlyRateAmount: Number(activityRate.hourlyRate.amount),
            currency: activityRate.hourlyRate.currency,
          }
        : {
            ...defaultValues,
            activityType: firstAvailableType ?? defaultValues.activityType,
          },
    );
  }, [activityRate, firstAvailableType, open]);

  const canSave =
    values.activityType &&
    !configuredTypes.has(values.activityType) &&
    values.currency.trim().length > 0 &&
    values.hourlyRateAmount >= 0;

  const handleSubmit = () => {
    onSave(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="outline" size="icon">
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            <span className="sr-only">Modifier</span>
          </Button>
        ) : (
          <Button disabled={!firstAvailableType}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Ajouter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le taux" : "Ajouter un taux"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? activityTypeLabel(activityRate!.activityType)
              : "Configurer un coût horaire par type d'activité"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="activity-rate-type">Type d'activité</Label>
            <Select
              value={values.activityType}
              disabled={isEditing}
              onValueChange={(activityType) =>
                setValues((current) => ({
                  ...current,
                  activityType: activityType as ActivityType,
                }))
              }
            >
              <SelectTrigger id="activity-rate-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {activityTypes.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      disabled={configuredTypes.has(type.value)}
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <div className="grid gap-2">
              <Label htmlFor="activity-rate-amount">Taux horaire</Label>
              <Input
                id="activity-rate-amount"
                type="number"
                min={0}
                step="0.01"
                value={values.hourlyRateAmount}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    hourlyRateAmount: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="activity-rate-currency">Devise</Label>
              <Input
                id="activity-rate-currency"
                value={values.currency}
                maxLength={3}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    currency: event.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSave || isSaving}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
