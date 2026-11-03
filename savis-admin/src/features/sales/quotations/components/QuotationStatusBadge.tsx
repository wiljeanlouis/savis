import { Badge } from "@/shared/ui/badge";
import type { QuotationStatus } from "../types";
import { quotationStatusLabels } from "../types";

/** Displays the current quotation lifecycle state. */
export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const variant =
    status === "ACCEPTED"
      ? "default"
      : status === "REJECTED"
        ? "destructive"
        : status === "SENT"
          ? "secondary"
          : "outline";
  return <Badge variant={variant}>{quotationStatusLabels[status]}</Badge>;
}
