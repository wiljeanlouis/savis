import { Badge } from "@/shared/ui/badge";
import type { InvoiceStatus } from "../types";
import { invoiceStatusLabels } from "../types";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "ISSUED") {
    return (
      <Badge
        variant="outline"
        className="border-blue-600/40 bg-blue-50 text-blue-800 dark:border-blue-400/40 dark:bg-blue-950/50 dark:text-blue-300"
      >
        {invoiceStatusLabels[status]}
      </Badge>
    );
  }

  return (
    <Badge variant={status === "CANCELLED" ? "destructive" : "secondary"}>
      {invoiceStatusLabels[status]}
    </Badge>
  );
}
