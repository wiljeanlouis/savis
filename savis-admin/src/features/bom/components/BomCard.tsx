import { Button } from "@/shared/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import type { Bom } from "../types";
import { Link } from "react-router";
import { DeleteAlert } from "@/shared/components/DeleteAlert";
import { Badge } from "@/shared/ui/badge";

const formatPrice = (amount: number, currency: string) => {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(amount);
};

const formatYield = (quantity: number, unit: string) => {
  return `${quantity} ${unit}${quantity > 1 ? "s" : ""}`;
};

interface BomCardProps {
  bom: Bom;
  deleteBom: () => void;
}

export const BomCard = ({ bom, deleteBom }: BomCardProps) => {
  const { id, name, description, imageUrl, price, yield: bomYield } = bom;

  const link = id ? `/boms/${id}` : "";
  const priceLabel = price ? formatPrice(price.amount, price.currency) : "-";
  const yieldLabel = bomYield
    ? formatYield(bomYield.quantity, bomYield.unit)
    : "-";

  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0 flex flex-col justify-between">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <Badge variant="secondary" className="absolute top-2 right-2 z-40">
        {priceLabel}
      </Badge>
      <img
        src={imageUrl}
        alt={name}
        className="relative z-20 aspect-video w-full object-cover"
      />

      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{yieldLabel}</Badge>
        </div>
      </CardHeader>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">
          <Link to={link} className="w-full">
            Modifier
          </Link>
        </Button>

        <DeleteAlert item={name} onDelete={deleteBom} />
      </CardFooter>
    </Card>
  );
};
