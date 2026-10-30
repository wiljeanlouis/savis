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
      <header className="shrink-0 space-y-1.5 border-b px-5 py-4">
        <h2 className="text-xl leading-snug font-semibold tracking-tight [overflow-wrap:anywhere]">
          {bom?.name ?? selected.name}
        </h2>
        {bom && (
          <p className="text-sm text-muted-foreground">
            {bom.type === "FOOD" ? "Alimentaire" : "Matériel"} · Rendement :{" "}
            {formatBomQuantity(bom.yield.quantity, bom.yield.unit)}
          </p>
        )}
      </header>
      <div
        role="region"
        aria-label="Informations de la composition"
        tabIndex={0}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
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
              <BomCostSummary bom={bom} />
              <BomProductionDetails bom={bom} />
              <details className="border-t pt-3">
                <summary className="cursor-pointer rounded-sm py-1 text-sm font-medium marker:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary">
                  Description et instructions
                </summary>
                <div className="mt-3 space-y-4">
                  <div className="flex items-start gap-3">
                    <BomImage src={bom.imageUrl} name={bom.name} large />
                    <p className="min-w-0 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {bom.description || "Aucune description"}
                    </p>
                  </div>
                  {bom.instructions && (
                    <section className="space-y-1">
                      <h3 className="text-sm font-semibold">Instructions</h3>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {bom.instructions}
                      </p>
                    </section>
                  )}
                </div>
              </details>
            </>
          )
        )}
      </div>
      <BomDetailActions
        bom={detail.data ?? selected}
        cloneBom={cloneBom}
        deleteBom={deleteBom}
        isCloning={isCloning}
      />
    </section>
  );
}
