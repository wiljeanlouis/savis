import { Badge } from "@/shared/ui/badge";
import type { OrderStatus } from "../types";
import { orderStatusLabels } from "../types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant =
    status === "CANCELLED" || status === "REJECTED"
      ? "destructive"
      : status === "COMPLETED"
        ? "secondary"
        : status === "NEW"
          ? "outline"
          : "default";

  return <Badge variant={variant}>{orderStatusLabels[status]}</Badge>;
}
