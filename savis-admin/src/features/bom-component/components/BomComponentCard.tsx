import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import type {
  BomComponent,
  BomComponentEditValues,
  BomComponentStatus,
} from "../types";
import { BomComponentEditDialog } from "./BomComponentEditDialog";
import { DeleteAlert } from "@/shared/components/DeleteAlert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreVerticalCircle01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";

const statusVariant: Record<
  BomComponentStatus,
  "default" | "secondary" | "destructive"
> = {
  NEW: "secondary",
  VALID: "default",
  REJECTED: "destructive",
};

const formatPrice = (amount: string, currency: string) => {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(Number(amount));
};

const formatPackageSize = (value: number, unit: string) => {
  return `${value} ${unit}`;
};

interface BomComponentCardProps {
  bomComponent: BomComponent;
  isPatching: boolean;
  isDeleting: boolean;
  onPatch: (bomComponent: BomComponent, status: BomComponentStatus) => void;
  onEdit: (bomComponent: BomComponent, values: BomComponentEditValues) => void;
  onDelete: (bomComponent: BomComponent) => void;
}

export const BomComponentCard = ({
  bomComponent,
  isPatching,
  isDeleting,
  onPatch,
  onEdit,
  onDelete,
}: BomComponentCardProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const isBusy = isPatching || isDeleting;
  const price = bomComponent.price
    ? formatPrice(bomComponent.price.amount, bomComponent.price.currency)
    : "-";
  const packageSize = bomComponent.package_size
    ? formatPackageSize(
        bomComponent.package_size.value,
        bomComponent.package_size.unit,
      )
    : "-";

  return (
    <Card className="h-full">
      <div className="flex justify-center bg-muted p-4">
        <img
          src={bomComponent.image_url}
          alt={bomComponent.label}
          className="size-40 object-contain"
          loading="lazy"
        />
      </div>
      <CardHeader>
        <CardTitle>
          <a
            href={bomComponent.url}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-2 hover:underline"
          >
            {bomComponent.label}
          </a>
        </CardTitle>
        <CardDescription className="line-clamp-1">
          {bomComponent.brand ?? "-"}
        </CardDescription>
        <CardAction>
          <Badge variant={statusVariant[bomComponent.status]}>
            {bomComponent.status}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div>
          <div className="text-lg font-semibold">{price}</div>
          <div className="text-muted-foreground">{packageSize}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-muted-foreground">
          <div>
            <div className="text-[0.625rem] uppercase">Provider</div>
            <div className="truncate text-foreground">
              {bomComponent.provider.name}
            </div>
          </div>
          <div>
            <div className="text-[0.625rem] uppercase">Recherche</div>
            <div className="truncate text-foreground">
              {bomComponent.search_term ?? "-"}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex justify-end gap-2">
        {bomComponent.status !== "VALID" ? (
          <Button
            disabled={isBusy}
            onClick={() => onPatch(bomComponent, "VALID")}
          >
            Valider
          </Button>
        ) : null}
        {bomComponent.status === "VALID" ? (
          <Button
            variant="destructive"
            disabled={isBusy}
            onClick={() => onPatch(bomComponent, "REJECTED")}
          >
            Invalider
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={isBusy}>
              <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {bomComponent.status === "NEW" && (
              <>
                <DropdownMenuItem
                  onSelect={() => onPatch(bomComponent, "REJECTED")}
                >
                  Rejeter
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setIsDeleteOpen(true)}
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <BomComponentEditDialog
          bomComponent={bomComponent}
          isPatching={isBusy}
          onEdit={onEdit}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          hideTrigger
        />
        <DeleteAlert
          item={bomComponent.label}
          onDelete={() => onDelete(bomComponent)}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          hideTrigger
        />
      </CardFooter>
    </Card>
  );
};
