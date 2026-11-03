import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { Link } from "react-router";
import { InvoiceStatusBadge } from "../../invoices/components/InvoiceStatusBadge";
import { PaymentStatusBadge } from "../../invoices/components/PaymentStatusBadge";
import { formatOrderCurrency } from "../../orders/types";
import { OrderStatusBadge } from "../../orders/components/OrderStatusBadge";
import { QuoteRequestStatusBadge } from "../../quote-requests/components/QuoteRequestStatusBadge";
import { QuotationStatusBadge } from "../../quotations/components/QuotationStatusBadge";
import type { SalesWorkspaceBranch as SalesWorkspaceBranchType } from "../api/workspaceApi";
import {
  workspaceDocumentIcons,
  workspaceDocumentLabels,
} from "../model/workspacePresentation";

const workspaceStatusDateFormatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function SalesWorkspaceBranch({
  branch,
  returnTo,
}: {
  branch: SalesWorkspaceBranchType;
  returnTo: string;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const referenceUrl = documentUrl(branch);
  const isConsultationAction =
    branch.actionUrl === referenceUrl &&
    /^Consulter\b/i.test(branch.action ?? "");
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="min-w-0 py-2">
        <div
          className="flex flex-wrap items-start gap-x-3 gap-y-2"
          data-testid="workspace-node-header"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <HugeiconsIcon
                  icon={workspaceDocumentIcons[branch.type]}
                  className="size-4"
                  strokeWidth={2}
                  aria-hidden="true"
                  data-testid={`workspace-icon-${branch.type.toLowerCase()}`}
                />
                {workspaceDocumentLabels[branch.type]}
              </span>
              {referenceUrl ? (
                <Link
                  className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  to={withReturnTo(referenceUrl, returnTo)}
                >
                  {branch.reference}
                </Link>
              ) : (
                <span className="font-medium">{branch.reference}</span>
              )}
              {branch.amountCents !== null && (
                <span
                  className={`text-sm font-medium tabular-nums ${
                    branch.type === "INVOICE" ? "" : "text-muted-foreground"
                  }`}
                >
                  — {formatOrderCurrency(branch.amountCents)}
                </span>
              )}
            </div>
            {branch.type === "INVOICE" ? (
              <InvoiceStatusDetails branch={branch} />
            ) : (
              <div
                className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm"
                data-testid={`workspace-status-line-${branch.type.toLowerCase()}`}
              >
                <div className="flex flex-wrap items-center gap-1.5 [&_[data-slot=badge]]:border-border/70 [&_[data-slot=badge]]:bg-muted/50 [&_[data-slot=badge]]:text-muted-foreground">
                  {renderStatusBadges(branch)}
                </div>
                <StatusDate value={branch.lastActivity} />
              </div>
            )}
            {branch.warnings.map((warning) => (
              <p key={warning} className="text-sm text-destructive">
                {warning}
              </p>
            ))}
          </div>
          <div
            className="flex flex-wrap items-center gap-1"
            data-testid="workspace-node-controls"
          >
            {branch.action && branch.actionUrl && !isConsultationAction && (
              <Button asChild variant="outline">
                <Link to={withReturnTo(branch.actionUrl, returnTo)}>
                  {branch.action}
                </Link>
              </Button>
            )}
            {branch.children.length > 0 && (
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 border-0 bg-transparent p-0 shadow-none hover:bg-transparent aria-expanded:bg-transparent focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={`Afficher ou masquer les documents liés à ${branch.reference}`}
                >
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    className={`transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                    strokeWidth={2}
                    aria-hidden="true"
                    data-testid={
                      isOpen
                        ? "workspace-chevron-expanded"
                        : "workspace-chevron-collapsed"
                    }
                  />
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
        </div>
        {branch.children.length > 0 && (
          <CollapsibleContent>
            <div className="relative ml-3 mt-2 space-y-1 border-l border-border/70 pl-4">
              {branch.children.map((child) => (
                <div key={`${child.type}:${child.id}`} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-4 top-6 w-4 border-t border-border/70"
                  />
                  <SalesWorkspaceBranch branch={child} returnTo={returnTo} />
                </div>
              ))}
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

function renderStatusBadges(branch: SalesWorkspaceBranchType) {
  switch (branch.type) {
    case "REQUEST":
      switch (branch.status) {
        case "RECEIVED":
        case "IN_PROGRESS":
        case "QUOTED":
        case "CLOSED":
          return <QuoteRequestStatusBadge status={branch.status} />;
        default:
          return <UnavailableStatusBadge />;
      }
    case "QUOTATION":
      switch (branch.status) {
        case "DRAFT":
        case "SENT":
        case "ACCEPTED":
        case "REJECTED":
          return <QuotationStatusBadge status={branch.status} />;
        default:
          return <UnavailableStatusBadge />;
      }
    case "ORDER":
      switch (branch.status) {
        case "NEW":
        case "ACCEPTED":
        case "IN_PREPARATION":
        case "READY":
        case "COMPLETED":
        case "CANCELLED":
        case "REJECTED":
          return <OrderStatusBadge status={branch.status} />;
        default:
          return <UnavailableStatusBadge />;
      }
    case "INVOICE":
      return null;
  }
}

function InvoiceStatusDetails({
  branch,
}: {
  branch: SalesWorkspaceBranchType;
}) {
  return (
    <div className="space-y-1 text-sm">
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {renderInvoiceStatusBadge(branch.status)}
        <StatusDate value={branch.issuedAt} />
      </p>
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {branch.paymentStatus === "PAID" ||
        branch.paymentStatus === "UNPAID" ? (
          <PaymentStatusBadge status={branch.paymentStatus} />
        ) : (
          <UnavailableStatusBadge />
        )}
        {branch.paymentStatus !== "UNPAID" && (
          <StatusDate value={branch.paidAt} />
        )}
      </p>
    </div>
  );
}

function StatusDate({ value }: { value: string | null }) {
  return value ? (
    <time className="text-muted-foreground" dateTime={value}>
      — {workspaceStatusDateFormatter.format(new Date(value))}
    </time>
  ) : (
    <span className="text-muted-foreground">— Date non disponible</span>
  );
}

function renderInvoiceStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
    case "ISSUED":
    case "CANCELLED":
      return <InvoiceStatusBadge status={status} />;
    default:
      return <UnavailableStatusBadge />;
  }
}

function UnavailableStatusBadge() {
  return <Badge variant="outline">Statut indisponible</Badge>;
}

function documentUrl(branch: SalesWorkspaceBranchType): string | null {
  const documentId = encodeURIComponent(branch.id);

  switch (branch.type) {
    case "REQUEST":
      return `/sales/quote-requests/${documentId}`;
    case "QUOTATION":
      return `/quotations/${documentId}`;
    case "ORDER":
      return `/orders/${documentId}`;
    case "INVOICE":
      return `/invoices/${documentId}`;
  }
}

function withReturnTo(actionUrl: string | null, returnTo: string) {
  if (!actionUrl) return returnTo;
  const separator = actionUrl.includes("?") ? "&" : "?";
  return `${actionUrl}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}
