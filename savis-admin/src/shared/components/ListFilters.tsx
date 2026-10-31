import { useId, useRef } from "react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/shared/ui/button";
import { ButtonGroup } from "@/shared/ui/button-group";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export function ListSearchInput({
  label,
  placeholder,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <Field className="min-w-0 flex-1 sm:min-w-64">
      <ButtonGroup className="w-full">
        <Input
          ref={input}
          aria-label={label}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          variant="outline"
          type="button"
          aria-label="Rechercher"
          onClick={() => input.current?.focus()}
        >
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
        </Button>
      </ButtonGroup>
    </Field>
  );
}

export function ListSelectFilter({
  label,
  value,
  onChange,
  options,
  inPanel = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  inPanel?: boolean;
}) {
  const id = useId();
  return (
    <div
      className={
        inPanel
          ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3"
          : "flex w-full items-center gap-2 sm:w-auto"
      }
    >
      <Label
        htmlFor={id}
        className={
          inPanel
            ? "text-muted-foreground"
            : "shrink-0 whitespace-nowrap text-muted-foreground"
        }
      >
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          aria-label={label}
          className={
            inPanel ? "w-full min-w-0" : "min-w-0 flex-1 sm:w-44 sm:flex-none"
          }
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([code, text]) => (
            <SelectItem key={code} value={code}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
