import { useEffect, useRef } from "react";
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
import { BomImage } from "./BomImage";
import { formatBomQuantity } from "../model/bomCostPresentation";
export const BomList = () => {
  const management = useBomList();
  const {
    params,
    units,
    reset,
    size,
    filtered,
    totalPages,
    page,
    items,
    selected,
    mobile,
    showList,
    update,
  } = useBomWorkspace(management.boms);
  const detailRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mobile && window.matchMedia?.("(max-width: 1023px)").matches)
      detailRef.current?.focus();
  }, [mobile, selected?.id]);
  return (
    <div className="min-w-0 space-y-5 dark:[--primary:#e078a4] dark:[--primary-foreground:#24131a]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Compositions</h1>
          <p className="text-sm text-muted-foreground">
            Définitions de fabrication des biens et services commercialisables.
          </p>
        </div>
        <Button asChild>
          <Link to="/boms/add">+ Ajouter</Link>
        </Button>
      </header>
      <BomListFilters
        params={params}
        units={units}
        update={update}
        reset={reset}
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
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div
            ref={listRef}
            className={`${mobile ? "hidden lg:block" : ""} min-w-0 space-y-3`}
          >
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
              <ul
                aria-label="Liste des compositions"
                className="divide-y border-y"
              >
                {items.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      aria-label={`Consulter ${b.name}`}
                      aria-pressed={selected?.id === b.id}
                      className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 border-l-[3px] border-transparent py-4 pr-3 pl-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px] aria-pressed:border-primary aria-pressed:bg-primary/10"
                      onClick={() => update("selected", b.id!, false)}
                    >
                      <BomImage src={b.imageUrl} name={b.name} />
                      <span className="min-w-0">
                        <span className="line-clamp-2 [overflow-wrap:anywhere] text-sm leading-snug font-medium">
                          {b.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatBomQuantity(b.yield.quantity, b.yield.unit)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
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
          <div
            ref={detailRef}
            tabIndex={-1}
            className={`${mobile ? "fixed inset-0 z-40 flex" : "hidden"} min-h-0 min-w-0 flex-col gap-2 bg-background p-3 outline-none lg:sticky lg:inset-auto lg:top-4 lg:z-auto lg:flex lg:bg-transparent lg:p-0`}
          >
            {selected ? (
              <>
                <Button
                  variant="outline"
                  className="shrink-0 self-start lg:hidden"
                  onClick={() => {
                    showList();
                    requestAnimationFrame(() =>
                      listRef.current
                        ?.querySelector<HTMLButtonElement>(
                          '[aria-pressed="true"]',
                        )
                        ?.focus(),
                    );
                  }}
                >
                  Retour à la liste
                </Button>
                <BomDetails
                  key={selected.id}
                  selected={selected}
                  cloneBom={() => void management.cloneBom(selected)}
                  deleteBom={() => void management.deleteBom(selected.id!)}
                  isCloning={management.isCloning}
                />
              </>
            ) : (
              <p className="border-y border-dashed p-8 text-center text-sm text-muted-foreground">
                Aucune composition à consulter.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
