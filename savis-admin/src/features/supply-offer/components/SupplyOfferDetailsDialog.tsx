import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  formatSupplyOfferDate,
  formatSupplyOfferPackage,
  formatSupplyOfferPrice,
} from "../format";
import type { SupplyOffer } from "../types";
import { safeExternalUrl, SupplyOfferImage } from "./SupplyOfferImage";
import { SupplyOfferStatusBadge } from "./SupplyOfferStatusBadge";

interface SupplyOfferDetailsDialogProps {
  offer: SupplyOffer | null;
  onClose: () => void;
}

/** Displays the complete persisted snapshot without offering write actions. */
export function SupplyOfferDetailsDialog({
  offer,
  onClose,
}: SupplyOfferDetailsDialogProps) {
  const productUrl = safeExternalUrl(offer?.url ?? null);
  const providerSite = safeExternalUrl(offer?.provider?.site ?? null);

  return (
    <Dialog
      open={offer !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        {offer ? (
          <>
            <DialogHeader>
              <DialogTitle>{offer.label ?? offer.componentName}</DialogTitle>
              <DialogDescription>
                Détails de l’offre fournisseur enregistrée dans Supply.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
              <SupplyOfferImage
                imageUrl={offer.imageUrl}
                alt={offer.label ?? offer.componentName}
                className="size-40"
              />

              <dl className="grid min-w-0 grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <DetailTerm>Identifiant</DetailTerm>
                <DetailValue>{offer.id}</DetailValue>
                <DetailTerm>Composant</DetailTerm>
                <DetailValue>{offer.componentName}</DetailValue>
                <DetailTerm>Libellé</DetailTerm>
                <DetailValue>{offer.label ?? "—"}</DetailValue>
                <DetailTerm>Marque</DetailTerm>
                <DetailValue>{offer.brand ?? "—"}</DetailValue>
                <DetailTerm>Fournisseur</DetailTerm>
                <DetailValue>{providerName(offer)}</DetailValue>
                <DetailTerm>Référence fournisseur</DetailTerm>
                <DetailValue>{offer.provider?.identifier ?? "—"}</DetailValue>
                <DetailTerm>Prix du paquet</DetailTerm>
                <DetailValue>{formatSupplyOfferPrice(offer.price)}</DetailValue>
                <DetailTerm>Format</DetailTerm>
                <DetailValue>
                  {formatSupplyOfferPackage(offer.packageSize)}
                </DetailValue>
                <DetailTerm>Statut</DetailTerm>
                <DetailValue>
                  <SupplyOfferStatusBadge status={offer.status} />
                </DetailValue>
                <DetailTerm>Dernière observation</DetailTerm>
                <DetailValue>
                  {formatSupplyOfferDate(offer.lastSeen)}
                </DetailValue>
              </dl>
            </div>

            <DialogFooter>
              {providerSite ? (
                <Button asChild type="button" variant="outline">
                  <a
                    href={providerSite}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={2} />
                    Site du fournisseur
                  </a>
                </Button>
              ) : null}
              {productUrl ? (
                <Button asChild type="button">
                  <a
                    href={productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={2} />
                    Voir le produit
                  </a>
                </Button>
              ) : null}
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailTerm({ children }: { children: React.ReactNode }) {
  return <dt className="font-medium text-muted-foreground">{children}</dt>;
}

function DetailValue({ children }: { children: React.ReactNode }) {
  return <dd className="min-w-0 break-words">{children}</dd>;
}

function providerName(offer: SupplyOffer) {
  return offer.provider?.name ?? offer.provider?.identifier ?? "—";
}
