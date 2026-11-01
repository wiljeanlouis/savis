import { Badge } from "@/shared/ui/badge";
import { requestStatusLabels, type RequestStatus } from "../model/types";
export function QuoteRequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge
      variant={
        status === "QUOTED"
          ? "default"
          : status === "CLOSED"
            ? "secondary"
            : status === "IN_PROGRESS"
              ? "secondary"
              : "outline"
      }
    >
      {requestStatusLabels[status]}
    </Badge>
  );
}
