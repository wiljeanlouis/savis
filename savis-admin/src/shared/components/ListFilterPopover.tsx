import { useId, type ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Filter } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function ListFilterPopover({
  label,
  count,
  onClear,
  children,
}: {
  label: string;
  count: number;
  onClear: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" type="button">
          <HugeiconsIcon icon={Filter} strokeWidth={2} />
          Filtres{count > 0 ? ` · ${count}` : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        collisionPadding={16}
        aria-labelledby={titleId}
        className="w-96 max-w-[calc(100vw-2rem)] max-h-[var(--radix-popover-content-available-height)] gap-4 overflow-y-auto p-4"
      >
        <h2 id={titleId} className="sr-only">
          {label}
        </h2>
        {children}
        <Button
          variant="ghost"
          type="button"
          disabled={count === 0}
          onClick={onClear}
          className="self-start"
        >
          Effacer les filtres
        </Button>
      </PopoverContent>
    </Popover>
  );
}
