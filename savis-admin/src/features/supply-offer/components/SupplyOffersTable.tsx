import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { LinkSquare01Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  formatSupplyOfferDate,
  formatSupplyOfferPackage,
  formatSupplyOfferPrice,
} from "../format";
import type { SupplyOffer } from "../types";
import { safeExternalUrl, SupplyOfferImage } from "./SupplyOfferImage";
import { SupplyOfferStatusBadge } from "./SupplyOfferStatusBadge";

interface SupplyOffersTableProps {
  offers: SupplyOffer[];
  resourceNames?: Record<string, string>;
  resourcesLoading?: boolean;
  onViewDetails: (offer: SupplyOffer) => void;
}

/** Read-only table of persisted supplier offers. */
export function SupplyOffersTable({
  offers,
  resourceNames = {},
  resourcesLoading = false,
  onViewDetails,
}: SupplyOffersTableProps) {
  return (
    <Card className="py-0">
      <CardContent className="px-0">
        <Table className="min-w-240">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Ressource</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Prix du paquet</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dernière observation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => {
              const productUrl = safeExternalUrl(offer.url);
              const displayName = offer.label ?? offer.componentName;

              return (
                <TableRow key={offer.id}>
                  <TableCell>
                    <SupplyOfferImage
                      imageUrl={offer.imageUrl}
                      alt={displayName}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-56 truncate font-medium">
                      {displayName}
                    </span>
                    <span className="block max-w-56 truncate text-muted-foreground">
                      {offer.brand ?? "Marque non renseignée"}
                    </span>
                    <span className="block max-w-56 truncate text-xs text-muted-foreground">
                      {offer.componentName}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-40 truncate">
                    {offer.resourceId
                      ? (resourceNames[offer.resourceId] ??
                        (resourcesLoading ? "Chargement…" : "Nom indisponible"))
                      : "Non associée"}
                  </TableCell>
                  <TableCell>
                    {offer.provider?.name ?? offer.provider?.identifier ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatSupplyOfferPrice(offer.price)}
                  </TableCell>
                  <TableCell>
                    {formatSupplyOfferPackage(offer.packageSize)}
                  </TableCell>
                  <TableCell>
                    <SupplyOfferStatusBadge status={offer.status} />
                  </TableCell>
                  <TableCell>{formatSupplyOfferDate(offer.lastSeen)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {productUrl ? (
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Ouvrir ${displayName} chez le fournisseur`}
                          >
                            <HugeiconsIcon
                              icon={LinkSquare01Icon}
                              strokeWidth={2}
                            />
                            Produit
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(offer)}
                        aria-label={`Afficher les détails de ${displayName}`}
                      >
                        <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
                        Détails
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
