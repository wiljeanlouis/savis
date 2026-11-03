import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { Link } from "react-router";
import { formatOrderCurrency, formatOrderDate } from "../../orders/types";
import type { SalesWorkspaceBranch as SalesWorkspaceBranchType } from "../api/workspaceApi";
import {
  workspaceDocumentIcons,
  workspaceDocumentLabels,
  workspacePaymentStatusLabels,
  workspaceStatusLabels,
} from "../model/workspacePresentation";

export function SalesWorkspaceBranch({
  branch,
  returnTo,
  depth = 0,
}: {
  branch: SalesWorkspaceBranchType;
  returnTo: string;
  depth?: number;
}) {
  const label = workspaceDocumentLabels[branch.type];
  const row = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <HugeiconsIcon
            icon={workspaceDocumentIcons[branch.type]}
            className="size-4 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
            data-testid={`workspace-icon-${branch.type.toLowerCase()}`}
          />
          {label}
        </p>
        <Link
          className="font-medium hover:underline"
          to={withReturnTo(branch.actionUrl, returnTo)}
        >
          {branch.reference}
        </Link>
        <p className="text-sm text-muted-foreground">
          {workspaceStatusLabels[branch.type][branch.status] ??
            "Statut indisponible"}
          {branch.type === "INVOICE" && branch.paymentStatus
            ? ` · ${workspacePaymentStatusLabels[branch.paymentStatus] ?? branch.paymentStatus}`
            : ""}
          {branch.amountCents !== null
            ? ` · ${formatOrderCurrency(branch.amountCents)}`
            : ""}
          {branch.lastActivity
            ? ` · ${formatOrderDate(branch.lastActivity)}`
            : ""}
        </p>
        {branch.warnings.map((warning) => (
          <p key={warning} className="mt-1 text-sm text-destructive">
            {warning}
          </p>
        ))}
      </div>
      {branch.action && branch.actionUrl && (
        <Button asChild variant="outline" className="self-start">
          <Link to={withReturnTo(branch.actionUrl, returnTo)}>
            {branch.action}
          </Link>
        </Button>
      )}
    </div>
  );

  if (branch.children.length === 0) {
    return (
      <div
        className="border-l py-3 pl-4"
        style={{ marginLeft: `${depth * 1.25}rem` }}
      >
        {row}
      </div>
    );
  }

  return (
    <Collapsible defaultOpen>
      <section
        className="border-l py-3 pl-4"
        style={{ marginLeft: `${depth * 1.25}rem` }}
      >
        <div className="flex items-start justify-between gap-3">
          {row}
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Afficher ou masquer les documents liés à ${branch.reference}`}
            >
              Parcours
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-2 space-y-1">
            {branch.children.map((child) => (
              <SalesWorkspaceBranch
                key={`${child.type}:${child.id}`}
                branch={child}
                returnTo={returnTo}
                depth={depth + 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function withReturnTo(actionUrl: string | null, returnTo: string) {
  if (!actionUrl) return returnTo;
  const separator = actionUrl.includes("?") ? "&" : "?";
  return `${actionUrl}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}
