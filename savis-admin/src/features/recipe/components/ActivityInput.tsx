import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { ActivityType, RecipeActivity } from "../types";

interface Props {
  value: RecipeActivity;
  onChange: (value: RecipeActivity) => void;
  onRemove: () => void;
  canRemove?: boolean;
}

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: "PREP", label: "Préparation" },
  { value: "COOK", label: "Cuisson" },
  { value: "ASSEMBLY", label: "Assemblage" },
  { value: "PACKAGING", label: "Emballage" },
  { value: "INSTALLATION", label: "Installation" },
  { value: "DELIVERY", label: "Livraison" },
  { value: "CLEANUP", label: "Nettoyage" },
  { value: "CUSTOM", label: "Autre" },
];

export const ActivityInput = ({
  value,
  onChange,
  onRemove,
  canRemove = true,
}: Props) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="flex col-span-2 gap-2">
        <Field>
          <Select
            value={value.type}
            onValueChange={(type) =>
              onChange({ ...value, type: type as ActivityType })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <Field>
          <Input
            placeholder="Minutes"
            type="number"
            min={0}
            value={value.minutes}
            required
            onChange={(e) =>
              onChange({ ...value, minutes: Number(e.target.value) })
            }
          />
        </Field>
        <Field>
          <label htmlFor="" className="text-xs">
            Minutes
          </label>
        </Field>

        <Button
          type="button"
          variant="destructive"
          onClick={onRemove}
          disabled={!canRemove}
        >
          X
        </Button>
      </div>
    </div>
  );
};
