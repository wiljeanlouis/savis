import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
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
  onEdit,
  onOffers,
  onChangeStatus,
}: {
  resources: MaterialResource[];
  changingStatus: boolean;
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
                <TableCell>
                  <Badge variant="outline">
                    {resource.status === "ACTIVE" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(resource)}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOffers(resource)}
                    >
                      Offres
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={changingStatus}
                      onClick={() => onChangeStatus(resource)}
                    >
                      {resource.status === "ACTIVE" ? "Désactiver" : "Activer"}
                    </Button>
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
