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
import type { MaterialResource } from "../types";

export function ResourceListFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status?: MaterialResource["status"];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}) {
  return (
    <section
      aria-label="Filtres des ressources"
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <Field className="flex-1">
        <ButtonGroup className="w-full">
          <Input
            id="resource-search"
            aria-label="Rechercher les ressources"
            placeholder="Rechercher par nom ou description"
            maxLength={160}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <Button
            variant="outline"
            type="button"
            aria-label="Rechercher"
            onClick={() => document.getElementById("resource-search")?.focus()}
          >
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </Button>
        </ButtonGroup>
      </Field>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Label
          htmlFor="resource-status"
          className="whitespace-nowrap text-muted-foreground"
        >
          Filtrer par statut
        </Label>
        <Select
          value={status ?? "ALL"}
          onValueChange={(value) =>
            onStatusChange(value === "ALL" ? "" : value)
          }
        >
          <SelectTrigger
            id="resource-status"
            aria-label="Filtrer par statut"
            className="flex-1 sm:w-48 sm:flex-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes</SelectItem>
            <SelectItem value="ACTIVE">Actives</SelectItem>
            <SelectItem value="INACTIVE">Inactives</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
