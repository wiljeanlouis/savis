import { NoData } from "@/shared/components/NoData";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { QuotationsTable } from "../components/QuotationsTable";
import {
  useQuotationDocumentDownload,
  useQuotations,
} from "../hooks/useQuotationApi";

/** Displays all standalone commercial quotations. */
export function QuotationsPage() {
  const query = useQuotations();
  const documents = useQuotationDocumentDownload();
  const quotations = query.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Soumissions</h1>
          <p className="text-sm text-muted-foreground">
            Préparez et suivez les offres commerciales avant la commande.
          </p>
        </div>
        <Button asChild>
          <Link to="/quotations/new">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Nouvelle soumission
          </Link>
        </Button>
      </div>

      {query.isPending ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : query.isError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          Impossible de charger les soumissions.
        </p>
      ) : quotations.length === 0 ? (
        <NoData />
      ) : (
        <QuotationsTable
          quotations={quotations}
          downloadingQuotationId={
            documents.isPending ? documents.pendingQuotationId : undefined
          }
          onDownload={(id) => void documents.download(id)}
        />
      )}
    </div>
  );
}
