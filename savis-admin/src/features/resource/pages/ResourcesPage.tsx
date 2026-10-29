import { useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/api/apiError";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/table";
import { useResources } from "../hooks/useResources";
import { ResourceEditor } from "../components/ResourceEditor";
import {
  resourceCategories,
  type MaterialResource,
  type ResourceValues,
} from "../types";

export function ResourcesPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const rawPage = Number(params.get("page") ?? 0);
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const { list, save, changeStatus } = useResources(search, page);
  const [editor, setEditor] = useState<MaterialResource | "new" | null>(null);
  const saveValues = async (values: ResourceValues) => {
    try {
      await save.mutateAsync({
        id: editor && editor !== "new" ? editor.id : undefined,
        values,
      });
      setEditor(null);
      toast.success("Ressource enregistrée.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ressources matérielles</h1>
          <p className="text-sm text-muted-foreground">
            Référentiel des ingrédients, consommables, emballages, équipements
            et matériels de décoration.
          </p>
        </div>
        <Button onClick={() => setEditor("new")}>Nouvelle ressource</Button>
      </header>
      {editor && (
        <ResourceEditor
          key={editor === "new" ? "new" : editor.id}
          resource={editor === "new" ? undefined : editor}
          saving={save.isPending}
          onSave={saveValues}
          onCancel={() => setEditor(null)}
        />
      )}
      <Input
        aria-label="Rechercher les ressources"
        placeholder="Rechercher par nom ou description"
        maxLength={160}
        value={search}
        onChange={(event) => {
          const next = new URLSearchParams(params);
          next.set("search", event.target.value);
          next.delete("page");
          setParams(next, { replace: true });
        }}
      />
      {list.isPending ? (
        <p role="status">Chargement des ressources…</p>
      ) : list.isError ? (
        <p role="alert">{getApiErrorMessage(list.error)}</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ressource</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.content.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="whitespace-normal">
                    <strong>{resource.name}</strong>
                    <p className="text-muted-foreground">
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditor(resource)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={changeStatus.isPending}
                        onClick={() =>
                          changeStatus.mutate(
                            {
                              id: resource.id,
                              status:
                                resource.status === "ACTIVE"
                                  ? "INACTIVE"
                                  : "ACTIVE",
                            },
                            {
                              onError: (error) =>
                                toast.error(getApiErrorMessage(error)),
                            },
                          )
                        }
                      >
                        {resource.status === "ACTIVE"
                          ? "Désactiver"
                          : "Activer"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {list.data.content.length === 0 && <p>Aucune ressource trouvée.</p>}
          <nav
            aria-label="Pagination des ressources"
            className="flex items-center justify-end gap-3"
          >
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", String(page - 1));
                setParams(next);
              }}
            >
              Précédent
            </Button>
            <span className="text-sm">
              Page {page + 1} / {Math.max(1, list.data.totalPages)}
            </span>
            <Button
              variant="outline"
              disabled={page + 1 >= list.data.totalPages}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", String(page + 1));
                setParams(next);
              }}
            >
              Suivant
            </Button>
          </nav>
        </>
      )}
    </div>
  );
}
