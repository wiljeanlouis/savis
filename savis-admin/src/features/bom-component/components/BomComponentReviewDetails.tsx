import { useLayoutEffect, useRef, useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DeleteAlert } from "@/shared/components/DeleteAlert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/ui/alert-dialog";
import {
  safeExternalUrl,
  SupplyOfferImage,
} from "@/features/supply-offer/components/SupplyOfferImage";
import { formatSupplyOfferDate } from "@/features/supply-offer/format";
import { BomComponentEditDialog } from "./BomComponentEditDialog";
import type {
  BomComponent,
  BomComponentEditValues,
  BomComponentStatus,
} from "../types";

export const reviewStatusLabels: Record<BomComponentStatus, string> = {
  NEW: "À valider",
  VALID: "Validée",
  REJECTED: "Rejetée",
};

export const reviewStatusBadgeClass = (status: BomComponentStatus) =>
  status === "VALID"
    ? "border-emerald-600/40 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-950/50 dark:text-emerald-300"
    : undefined;

export function reviewPrice(offer: BomComponent) {
  return offer.price
    ? new Intl.NumberFormat("fr-CA", {
        style: "currency",
        currency: offer.price.currency,
      }).format(Number(offer.price.amount))
    : "Prix non renseigné";
}

export function reviewPackage(offer: BomComponent) {
  return offer.package_size
    ? `${offer.package_size.value} ${offer.package_size.unit}`
    : "Format non renseigné";
}

interface Props {
  offer: BomComponent;
  busy: boolean;
  onPatch: (offer: BomComponent, status: BomComponentStatus) => void;
  onEdit: (offer: BomComponent, values: BomComponentEditValues) => void;
  onDelete: (offer: BomComponent) => void;
}

export function BomComponentReviewDetails({
  offer,
  busy,
  onPatch,
  onEdit,
  onDelete,
}: Props) {
  const [confirmRejection, setConfirmRejection] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<BomComponentEditValues | null>(
    null,
  );
  const panelRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    // Follow the panel's sticky position so the footer also fits short windows.
    const updateAvailableHeight = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const top = Math.max(16, panel.getBoundingClientRect().top);
      panel.style.setProperty(
        "--review-detail-height",
        `${Math.max(0, window.innerHeight - top - 16)}px`,
      );
    };
    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    window.addEventListener("scroll", updateAvailableHeight, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("resize", updateAvailableHeight);
      window.removeEventListener("scroll", updateAvailableHeight, true);
    };
  }, []);

  const url = safeExternalUrl(offer.url);
  const fields = [
    ["Terme de recherche", offer.search_term || "—"],
    ["Dernière observation", formatSupplyOfferDate(offer.last_retrieved_at)],
    ["Actualisation", `Toutes les ${offer.refresh_frequency_hours} h`],
    ["Prochaine actualisation", formatSupplyOfferDate(offer.next_refresh_at)],
  ];
  return (
    <section
      ref={panelRef}
      aria-label={`Détail de ${offer.label}`}
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card lg:max-h-[var(--review-detail-height,calc(100dvh-2rem))]"
    >
      <div
        role="region"
        aria-label="Informations de l'offre"
        tabIndex={0}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        <header className="flex items-start gap-3">
          <SupplyOfferImage
            imageUrl={offer.image_url}
            alt={offer.label}
            className="size-16 shrink-0 bg-muted object-contain sm:size-20"
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Badge
              variant={
                offer.status === "REJECTED"
                  ? "destructive"
                  : offer.status === "VALID"
                    ? "outline"
                    : "secondary"
              }
              className={reviewStatusBadgeClass(offer.status)}
            >
              {reviewStatusLabels[offer.status]}
            </Badge>
            <h2 className="break-words text-xl leading-snug font-semibold tracking-tight">
              {offer.label}
            </h2>
            {offer.brand && (
              <p className="break-words text-sm text-muted-foreground">
                {offer.brand}
              </p>
            )}
            <p className="break-words text-sm font-medium">
              {offer.provider.name}
            </p>
          </div>
        </header>
        <section
          aria-label="Prix et format"
          className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-y py-3"
        >
          <div>
            <p className="text-sm text-muted-foreground">Prix observé</p>
            <p className="text-2xl leading-tight font-semibold tracking-tight tabular-nums">
              {reviewPrice(offer)}
            </p>
          </div>
          <p className="text-base font-medium text-muted-foreground">
            {reviewPackage(offer)}
          </p>
        </section>
        <details className="border-t pt-3">
          <summary className="cursor-pointer rounded-sm py-1 text-sm font-medium marker:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary">
            Informations de collecte
          </summary>
          <dl className="mt-3 space-y-3 text-sm">
            {fields.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-baseline gap-3"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="min-w-0 break-words text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </details>
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <BomComponentEditDialog
            bomComponent={offer}
            isPatching={busy}
            onEdit={(item, values) => {
              if (values.status === "REJECTED" && item.status !== "REJECTED") {
                setPendingEdit(values);
                setConfirmRejection(true);
              } else onEdit(item, values);
            }}
          />
          {url && (
            <Button
              variant="outline"
              className="h-auto min-h-9 min-w-0 flex-1 whitespace-normal text-sm"
              asChild
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                Voir le produit chez le fournisseur
              </a>
            </Button>
          )}
          <DeleteAlert
            item={offer.label}
            onDelete={() => {
              if (!busy) onDelete(offer);
            }}
          />
        </div>
      </div>
      <div
        role="group"
        aria-label="Validation de l'offre"
        className="sticky bottom-0 z-10 flex shrink-0 flex-wrap gap-2 border-t bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] [&>button]:min-h-10 [&>button]:min-w-0 [&>button]:flex-1"
      >
        {offer.status !== "VALID" && (
          <Button disabled={busy} onClick={() => onPatch(offer, "VALID")}>
            Valider
          </Button>
        )}
        {offer.status !== "REJECTED" && (
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => {
              setPendingEdit(null);
              setConfirmRejection(true);
            }}
          >
            {offer.status === "VALID" ? "Invalider" : "Rejeter"}
          </Button>
        )}
      </div>
      <AlertDialog open={confirmRejection} onOpenChange={setConfirmRejection}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {offer.status === "VALID"
                ? "Invalider cette offre ?"
                : "Rejeter cette offre ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {offer.status === "VALID"
                ? "Cette offre ne sera plus disponible pour le calcul des coûts après traitement de son invalidation."
                : "Cette offre quittera la liste à valider. Vous pourrez la retrouver avec le filtre Rejetées."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => {
                if (pendingEdit) onEdit(offer, pendingEdit);
                else onPatch(offer, "REJECTED");
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
