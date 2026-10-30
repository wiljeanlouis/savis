import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Spinner } from "@/shared/ui/spinner";
import { Switch } from "@/shared/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/table";
import { resourceCategories, type MaterialResource } from "../types";

export function ResourcesTable({
  resources,
  changingStatus,
  changingStatusId,
  onEdit,
  onOffers,
  onChangeStatus,
}: {
  resources: MaterialResource[];
  changingStatus: boolean;
  changingStatusId?: string;
  onEdit: (resource: MaterialResource) => void;
  onOffers: (resource: MaterialResource) => void;
  onChangeStatus: (resource: MaterialResource) => void;
}) {
  return (
    <Card className="py-0">
      <CardContent className="px-0">
        <Table className="min-w-180">
          <TableHeader>
            <TableRow>
              <TableHead>Ressource</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Unité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell className="whitespace-normal">
                  <span className="block max-w-72 truncate font-medium">
                    {resource.name}
                  </span>
                  <p className="max-w-72 truncate text-muted-foreground">
                    {resource.description}
                  </p>
                </TableCell>
                <TableCell>{resourceCategories[resource.category]}</TableCell>
                <TableCell>{resource.referenceUnit ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={resource.status === "ACTIVE"}
                      disabled={changingStatus}
                      aria-label={`${resource.status === "ACTIVE" ? "Désactiver" : "Activer"} ${resource.name}`}
                      onCheckedChange={() => onChangeStatus(resource)}
                    />
                    {changingStatus && changingStatusId === resource.id && (
                      <Spinner
                        role="status"
                        aria-label={`Mise à jour du statut de ${resource.name}`}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOffers(resource)}
                    >
                      Offres
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Modifier"
                          onClick={() => onEdit(resource)}
                        >
                          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Modifier</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
