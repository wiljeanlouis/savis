import { useLayoutEffect, useRef } from "react";
import { useGetBom } from "../hooks/useBomApi";
import type { Bom } from "../types";
import { formatBomQuantity } from "../model/bomCostPresentation";
import { BomProductionDetails } from "./BomProductionDetails";
import { BomCostSummary } from "./BomCostSummary";
import { BomImage } from "./BomImage";
import { BomDetailActions } from "./BomDetailActions";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Button } from "@/shared/ui/button";

export function BomDetails({
  selected,
  cloneBom,
  deleteBom,
  isCloning,
}: {
  selected: Bom;
  cloneBom: () => void;
  deleteBom: () => void;
  isCloning: boolean;
}) {
  const detail = useGetBom(selected.id ?? undefined);
  const panelRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const resize = () => {
      const panel = panelRef.current;
      if (panel)
        panel.style.setProperty(
          "--bom-detail-height",
          `${Math.max(0, window.innerHeight - Math.max(12, panel.getBoundingClientRect().top) - 12)}px`,
        );
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", resize, { capture: true, passive: true });
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", resize, true);
    };
  }, []);
  const bom = detail.data;
  return (
    <section
      ref={panelRef}
      aria-label="Détail de la composition"
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card max-h-[var(--bom-detail-height,calc(100dvh-2rem))]"
    >
      <header className="shrink-0 border-b p-4">
        <h2 className="text-lg font-semibold [overflow-wrap:anywhere]">
          {selected.name}
        </h2>
      </header>
      <div
        role="region"
        aria-label="Informations de la composition"
        tabIndex={0}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        {detail.isPending ? (
          <p role="status">Chargement de la composition…</p>
        ) : detail.isError ? (
          <ApiErrorAlert
            title="Impossible de charger la composition."
            error={detail.error}
          >
            <Button variant="outline" onClick={() => void detail.refetch()}>
              Réessayer
            </Button>
          </ApiErrorAlert>
        ) : (
          bom && (
            <>
              <div className="flex items-start gap-3">
                <BomImage src={bom.imageUrl} name={bom.name} large />
                <div className="min-w-0 space-y-2">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {bom.description || "Aucune description"}
                  </p>
                  <p className="text-sm">
                    Rendement :{" "}
                    {formatBomQuantity(bom.yield.quantity, bom.yield.unit)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bom.type === "FOOD" ? "Alimentaire" : "Matériel"}
                  </p>
                </div>
              </div>
              <BomProductionDetails bom={bom} />
              <BomCostSummary bom={bom} />
              {bom.instructions && (
                <section className="space-y-2 border-t pt-3">
                  <h3 className="text-sm font-semibold">Instructions</h3>
                  <p className="whitespace-pre-wrap text-sm">
                    {bom.instructions}
                  </p>
                </section>
              )}
            </>
          )
        )}
      </div>
      <BomDetailActions
        bom={selected}
        cloneBom={cloneBom}
        deleteBom={deleteBom}
        isCloning={isCloning}
      />
    </section>
  );
}
