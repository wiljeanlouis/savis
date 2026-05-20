import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import type { Offer, OfferStatus } from "../types";
import { OfferEditDialog, type OfferEditValues } from "./OfferEditDialog";

const statusVariant: Record<
  OfferStatus,
  "default" | "secondary" | "destructive"
> = {
  NEW: "secondary",
  VALID: "default",
  REJECTED: "destructive",
};

const formatPrice = (amount: string, currency: string) => {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(Number(amount));
};

const formatPackageSize = (value: number, unit: string) => {
  return `${value} ${unit}`;
};

interface OfferCardProps {
  offer: Offer;
  isPatching: boolean;
  onPatch: (offer: Offer, status: OfferStatus) => void;
  onEdit: (offer: Offer, values: OfferEditValues) => void;
}

export const OfferCard = ({
  offer,
  isPatching,
  onPatch,
  onEdit,
}: OfferCardProps) => {
  const price = offer.price
    ? formatPrice(offer.price.amount, offer.price.currency)
    : "-";
  const packageSize = offer.package_size
    ? formatPackageSize(offer.package_size.value, offer.package_size.unit)
    : "-";
  const offerUrl = `${offer.provider.site}${offer.url}`;

  return (
    <Card className="h-full">
      <div className="flex justify-center bg-muted p-4">
        <img
          src={offer.image_url}
          alt={offer.label}
          className="size-40 object-contain"
          loading="lazy"
        />
      </div>
      <CardHeader>
        <CardTitle>
          <a
            href={offerUrl}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-2 hover:underline"
          >
            {offer.label}
          </a>
        </CardTitle>
        <CardDescription className="line-clamp-1">
          {offer.brand || "-"}
        </CardDescription>
        <CardAction>
          <Badge variant={statusVariant[offer.status]}>{offer.status}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div>
          <div className="text-lg font-semibold">{price}</div>
          <div className="text-muted-foreground">{packageSize}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-muted-foreground">
          <div>
            <div className="text-[0.625rem] uppercase">Provider</div>
            <div className="truncate text-foreground">
              {offer.provider.name}
            </div>
          </div>
          <div>
            <div className="text-[0.625rem] uppercase">Recherche</div>
            <div className="truncate text-foreground">
              {offer.search_term || "-"}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex gap-2">
        {offer.status !== "VALID" ? (
          <Button
            className="flex-1"
            disabled={isPatching}
            onClick={() => onPatch(offer, "VALID")}
          >
            Valider
          </Button>
        ) : null}
        {offer.status === "VALID" ? (
          <Button
            className="flex-1"
            variant="destructive"
            disabled={isPatching}
            onClick={() => onPatch(offer, "REJECTED")}
          >
            Invalider
          </Button>
        ) : (
          <Button
            className="flex-1"
            variant="outline"
            disabled={isPatching || offer.status === "REJECTED"}
            onClick={() => onPatch(offer, "REJECTED")}
          >
            Rejeter
          </Button>
        )}
        <OfferEditDialog
          offer={offer}
          isPatching={isPatching}
          onEdit={onEdit}
        />
      </CardFooter>
    </Card>
  );
};
