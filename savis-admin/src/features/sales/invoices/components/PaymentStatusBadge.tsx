import { Badge } from "@/shared/ui/badge";
import type { PaymentStatus } from "../types";
import { paymentStatusLabels } from "../types";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const variant = status === "PAID" ? "default" : "secondary";
  return <Badge variant={variant}>{paymentStatusLabels[status]}</Badge>;
}
