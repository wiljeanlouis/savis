import { ResourceOffersDialog } from "../components/ResourceOffersDialog";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/api/apiError";
import { Button } from "@/shared/ui/button";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { PageSelector } from "@/shared/components/PageSelector";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Spinner } from "@/shared/ui/spinner";
import { ResourcesTable } from "../components/ResourcesTable";
import { ResourceListFilters } from "../components/ResourceListFilters";
import { useResources } from "../hooks/useResources";
import { ResourceEditorDialog } from "../components/ResourceEditorDialog";
import { type MaterialResource, type ResourceValues } from "../types";

export function ResourcesPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const rawPage = Number(params.get("page") ?? 0);
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const status =
    params.get("status") === "ACTIVE" || params.get("status") === "INACTIVE"
      ? (params.get("status") as MaterialResource["status"])
      : undefined;
  const rawSize = Number(params.get("size") ?? 20);
  const pageSize = [10, 20, 30, 50].includes(rawSize) ? rawSize : 20;
  const { list, save, changeStatus } = useResources(
    search,
    page,
    status,
    pageSize,
  );
  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: key === "search" });
  };
  const [offersResource, setOffersResource] = useState<MaterialResource | null>(
    null,
  );
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
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ressources matérielles</h1>
          <p className="text-sm text-muted-foreground">
            Référentiel des ingrédients, consommables, emballages, équipements
            et matériels de décoration.
          </p>
        </div>
        <Button onClick={() => setEditor("new")}>Nouvelle ressource</Button>
      </header>
      {offersResource && (
        <ResourceOffersDialog
          resource={offersResource}
          onClose={() => setOffersResource(null)}
        />
      )}
      {editor && (
        <ResourceEditorDialog
          key={editor === "new" ? "new" : editor.id}
          resource={editor === "new" ? undefined : editor}
          saving={save.isPending}
          onSave={saveValues}
          onCancel={() => setEditor(null)}
        />
      )}
      <ResourceListFilters
        search={search}
        status={status}
        onSearchChange={(value) => updateParam("search", value)}
        onStatusChange={(value) => updateParam("status", value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <PageItemCount
            itemName="ressource"
            totalItems={
              list.isPending || list.isError
                ? undefined
                : list.data?.totalElements
            }
          />
          {list.isFetching && !list.isPending && (
            <span className="text-sm text-muted-foreground" role="status">
              Actualisation…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PageSelector
            pageSize={pageSize}
            onPageChange={(size) => updateParam("size", String(size))}
          />
        </div>
      </div>
      {list.isPending ? (
        <div
          role="status"
          aria-label="Chargement des ressources"
          className="flex min-h-64 items-center justify-center"
        >
          <Spinner />
        </div>
      ) : list.isError ? (
        <ApiErrorAlert
          title="Impossible de charger les ressources."
          error={list.error}
        >
          <Button variant="outline" onClick={() => void list.refetch()}>
            Réessayer
          </Button>
        </ApiErrorAlert>
      ) : list.data.content.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
          Aucune ressource ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <>
          <ResourcesTable
            resources={list.data.content}
            changingStatus={changeStatus.isPending}
            onEdit={setEditor}
            onOffers={setOffersResource}
            onChangeStatus={(resource) =>
              changeStatus.mutate(
                {
                  id: resource.id,
                  status: resource.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                },
                { onError: (error) => toast.error(getApiErrorMessage(error)) },
              )
            }
          />
          <nav aria-label="Pagination des ressources">
            <PageNavigator
              page={page + 1}
              totalPages={list.data.totalPages}
              goToPreviousPage={() => updateParam("page", String(page - 1))}
              goToNextPage={() => updateParam("page", String(page + 1))}
            />
          </nav>
        </>
      )}
    </div>
  );
}
