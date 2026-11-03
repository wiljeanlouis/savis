import { Badge } from "@/shared/ui/badge";
import type { PaymentStatus } from "../types";
import { paymentStatusLabels } from "../types";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const className =
    status === "PAID"
      ? "border-emerald-600/40 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-950/50 dark:text-emerald-300"
      : "border-amber-600/40 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/50 dark:text-amber-300";

  return (
    <Badge variant="outline" className={className}>
      {paymentStatusLabels[status]}
    </Badge>
  );
}
