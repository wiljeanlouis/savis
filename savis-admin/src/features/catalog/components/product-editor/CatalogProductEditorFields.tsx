import type { Bom } from "@/features/bom/types";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { BomCombobox } from "../BomCombobox";

const toNumber = (value: string) => Number(value) || 0;

export function TextField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

export function NumberField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(toNumber(event.target.value))}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

export function MoneyField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(toNumber(event.target.value))}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

export function DecimalField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="number"
        min="0.000001"
        step="any"
        required
        value={value}
        onChange={(event) => onChange(toNumber(event.target.value))}
      />
    </Field>
  );
}

export function CheckField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Field orientation="horizontal">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
      {description ? (
        <FieldContent>
          <FieldLabel>{label}</FieldLabel>
          <FieldDescription>{description}</FieldDescription>
        </FieldContent>
      ) : (
        <FieldLabel>{label}</FieldLabel>
      )}
    </Field>
  );
}

export function BomField({
  label,
  value,
  boms,
  required = false,
  onChange,
}: {
  label: string;
  value: string | null;
  boms: Bom[];
  required?: boolean;
  onChange: (value: string | null) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <BomCombobox
        boms={boms}
        value={value}
        required={required}
        onChange={onChange}
      />
    </Field>
  );
}

export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-start pt-7">
      <Button
        type="button"
        variant="destructive"
        size="icon-sm"
        aria-label="Retirer"
        onClick={onClick}
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
      </Button>
    </div>
  );
}
