import { Badge } from "@/shared/ui/badge";
import type { SupplyOfferStatus } from "../types";
import { supplyOfferStatusLabels } from "../types";

export function SupplyOfferStatusBadge({
  status,
}: {
  status: SupplyOfferStatus;
}) {
  return (
    <Badge variant={status === "AVAILABLE" ? "secondary" : "outline"}>
      {supplyOfferStatusLabels[status]}
    </Badge>
  );
}
