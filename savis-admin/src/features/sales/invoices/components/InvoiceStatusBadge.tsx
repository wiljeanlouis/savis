import { Badge } from "@/shared/ui/badge";
import type { InvoiceStatus } from "../types";
import { invoiceStatusLabels } from "../types";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const variant =
    status === "ISSUED"
      ? "default"
      : status === "CANCELLED"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{invoiceStatusLabels[status]}</Badge>;
}
