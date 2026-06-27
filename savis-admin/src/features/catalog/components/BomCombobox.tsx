import { useMemo, useState } from "react";
import type { Bom } from "@/features/bom/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

interface Props {
  boms: Bom[];
  value: string | null;
  required?: boolean;
  onChange: (value: string | null) => void;
}

export function BomCombobox({
  boms,
  value,
  required = false,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = boms.find((bom) => bom.id === value);
  const normalizedSearch = normalize(search);

  const availableBoms = useMemo(
    () =>
      boms
        .filter((bom) => bom.id)
        .filter(
          (bom) =>
            !normalizedSearch ||
            normalize(
              [bom.name, bom.description, bom.instructions].join(" "),
            ).includes(normalizedSearch),
        )
        .sort((left, right) => left.name.localeCompare(right.name, "fr")),
    [boms, normalizedSearch],
  );

  const close = () => {
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span
            className={selected ? "truncate" : "truncate text-muted-foreground"}
          >
            {selected?.name ?? "Sélectionner un BOM"}
          </span>
          <span aria-hidden="true">⌄</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) gap-2 p-2"
      >
        <Input
          autoFocus
          value={search}
          placeholder="Rechercher un BOM..."
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {!required && (
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between"
              onClick={() => {
                onChange(null);
                close();
              }}
            >
              <span>Aucun BOM</span>
              {!value && <span aria-hidden="true">✓</span>}
            </Button>
          )}
          {availableBoms.map((bom) => (
            <Button
              key={bom.id}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-between gap-3 py-2 text-left"
              onClick={() => {
                onChange(bom.id);
                close();
              }}
            >
              <span className="min-w-0">
                <span className="block truncate">{bom.name}</span>
                {bom.description && (
                  <span className="block truncate text-muted-foreground">
                    {bom.description}
                  </span>
                )}
              </span>
              {bom.id === value && <span aria-hidden="true">✓</span>}
            </Button>
          ))}
          {availableBoms.length === 0 && (
            <p className="px-2 py-3 text-center text-muted-foreground">
              Aucun BOM trouvé.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
