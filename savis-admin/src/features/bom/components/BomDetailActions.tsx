import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/shared/ui/button";
import { DeleteAlert } from "@/shared/components/DeleteAlert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { MoreVerticalCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Bom } from "../types";

export function BomDetailActions({
  bom,
  cloneBom,
  deleteBom,
  isCloning,
}: {
  bom: Bom;
  cloneBom: () => void;
  deleteBom: () => void;
  isCloning: boolean;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const name = bom.name;
  return (
    <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t p-3">
      <Button asChild>
        <Link to={`/boms/${bom.id}`}>Modifier</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to={`/boms/${bom.id}#bom-cost`}>Analyser les coûts</Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={isCloning}>
            <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={isCloning} onSelect={cloneBom}>
            Cloner
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setIsDeleteOpen(true)}
          >
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteAlert
        item={name}
        onDelete={deleteBom}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        hideTrigger
      />
    </footer>
  );
}
