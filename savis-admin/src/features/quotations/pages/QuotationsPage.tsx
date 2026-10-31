import { NoData } from "@/shared/components/NoData";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { QuotationsTable } from "../components/QuotationsTable";
import {
  useQuotationDocumentPreview,
  useQuotations,
} from "../hooks/useQuotationApi";

/** Displays all standalone commercial quotations. */
export function QuotationsPage() {
  const query = useQuotations();
  const documents = useQuotationDocumentPreview();
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
        <ApiErrorAlert
          title="Impossible de charger les soumissions."
          error={query.error}
        />
      ) : quotations.length === 0 ? (
        <NoData />
      ) : (
        <QuotationsTable
          quotations={quotations}
          openingQuotationId={
            documents.isPending ? documents.pendingQuotationId : undefined
          }
          onOpen={(id) => void documents.open(id)}
        />
      )}
    </div>
  );
}
