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
import { Badge } from "@/shared/ui/badge";

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
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent max-h-[var(--bom-detail-height,calc(100dvh-2rem))]"
    >
      <div
        role="region"
        aria-label="Informations de la composition"
        tabIndex={0}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pt-1 pb-5 [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
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
              <BomIdentityHeader bom={bom} />
              <div className="space-y-4">
                <BomProductionDetails bom={bom} />
                <section className="border-t pt-3">
                  <h3 className="text-sm font-semibold">
                    Description et instructions
                  </h3>
                  <div className="mt-3 space-y-4">
                    <div>
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
                </section>
              </div>
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

function BomIdentityHeader({ bom }: { bom: Bom }) {
  return (
    <header className="space-y-4">
      <div className="flex h-[300px] items-center justify-center">
        <BomImage
          src={bom.imageUrl}
          name={bom.name}
          className="size-[300px] max-w-full rounded-lg border-0 bg-white object-contain p-2"
        />
      </div>
      <div className="space-y-1.5">
        <Badge variant="secondary">
          {bom.type === "FOOD" ? "Alimentaire" : "Matériel"}
        </Badge>
        <h2 className="text-xl leading-snug font-semibold tracking-tight [overflow-wrap:anywhere]">
          {bom.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          Rendement : {formatBomQuantity(bom.yield.quantity, bom.yield.unit)}
        </p>
      </div>
      <BomCostSummary bom={bom} />
    </header>
  );
}
