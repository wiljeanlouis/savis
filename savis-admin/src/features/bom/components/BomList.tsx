import { useRef } from "react";
import { DetailSheet } from "@/shared/components/DetailSheet";
import { Link } from "react-router";
import { useBomWorkspace } from "../hooks/useBomWorkspace";
import { useBomList } from "../hooks/useBomList";
import { Button } from "@/shared/ui/button";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { PageItemCount } from "@/shared/components/PageItemCount";
import { PageNavigator } from "@/shared/components/PageNavigator";
import { PageSelector } from "@/shared/components/PageSelector";
import { BomListFilters } from "./BomListFilters";
import { BomDetails } from "./BomDetails";
import { BomDataTable } from "./BomDataTable";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
export const BomList = () => {
  const management = useBomList();
  const {
    params,
    reset,
    yieldUnits,
    size,
    filtered,
    totalPages,
    page,
    items,
    selected,
    showList,
    update,
  } = useBomWorkspace(management.boms);
  const listRef = useRef<HTMLDivElement>(null);
  return (
    <div className="min-w-0 space-y-6 dark:[--primary:#e078a4] dark:[--primary-foreground:#24131a]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Compositions</h1>
          <p className="text-sm text-muted-foreground">
            Définitions de fabrication des biens et services commercialisables.
          </p>
        </div>
        <Button>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          <Link to="/boms/add">Nouvelle composition</Link>
        </Button>
      </header>
      <BomListFilters
        params={params}
        update={update}
        reset={reset}
        yieldUnits={yieldUnits}
      />
      {management.isLoading ? (
        <p role="status">Chargement des compositions…</p>
      ) : management.isError ? (
        <ApiErrorAlert
          title="Impossible de charger les compositions."
          error={management.error}
        >
          <Button onClick={() => void management.refetch()}>Réessayer</Button>
        </ApiErrorAlert>
      ) : (
        <div className="space-y-3">
          <div ref={listRef} className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PageItemCount
                itemName="composition"
                totalItems={filtered.length}
              />
              <PageSelector
                pageSize={size}
                onPageChange={(v) => update("size", String(v))}
              />
            </div>
            {items.length ? (
              <BomDataTable
                items={items}
                selectedId={selected?.id}
                params={params}
                onSort={(v) => update("sort", v)}
                onSelect={(id) => update("selected", id, false)}
              />
            ) : (
              <p
                role="status"
                className="border-y border-dashed py-8 text-center text-sm text-muted-foreground"
              >
                {management.boms?.length
                  ? "Aucune composition ne correspond aux filtres sélectionnés."
                  : "Aucune composition."}
              </p>
            )}
            <PageNavigator
              page={page}
              totalPages={totalPages}
              goToPreviousPage={() => update("page", String(page - 1))}
              goToNextPage={() => update("page", String(page + 1))}
            />
          </div>
          <DetailSheet
            open={!!selected}
            onClose={showList}
            title="Détail de la composition"
            listRef={listRef}
          >
            {selected && (
              <BomDetails
                key={selected.id}
                selected={selected}
                cloneBom={() => void management.cloneBom(selected)}
                deleteBom={() => void management.deleteBom(selected.id!)}
                isCloning={management.isCloning}
              />
            )}
          </DetailSheet>
        </div>
      )}
    </div>
  );
};
