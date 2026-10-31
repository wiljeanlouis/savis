import { useState, type FormEvent } from "react";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { OrderEditorForm } from "@/features/orders/components/OrderEditorForm";
import { OrderItemsDetails } from "@/features/orders/components/OrderItemsDetails";
import {
  formatOrderAddress,
  formatPhoneForDisplay,
} from "@/features/orders/model/contactFormat";
import { formatOrderCurrency, formatOrderDate } from "@/features/orders/types";
import { getApiErrorMessage } from "@/shared/api/apiError";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Spinner } from "@/shared/ui/spinner";
import {
  CheckmarkCircle02Icon,
  Edit02Icon,
  FileViewIcon,
  SentIcon,
  ShoppingCart02Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { formatDateOnly } from "../components/QuotationsTable";
import { QuotationStatusBadge } from "../components/QuotationStatusBadge";
import { useQuotationEditor } from "../hooks/useQuotationEditor";
import {
  useConvertQuotation,
  useCreateQuotation,
  useQuotation,
  useQuotationDocumentPreview,
  useUpdateQuotation,
  useUpdateQuotationStatus,
} from "../hooks/useQuotationApi";
import type { Quotation, QuotationStatus } from "../types";

/** Creates, edits and consults a quotation on one consistent page. */
export function QuotationDetailsPage() {
  const { quotationId } = useParams();
  return (
    <QuotationDetailsContent
      key={quotationId ?? "new"}
      quotationId={quotationId}
    />
  );
}

function QuotationDetailsContent({ quotationId }: { quotationId?: string }) {
  const navigate = useNavigate();
  const isCreating = !quotationId;
  const query = useQuotation(quotationId);
  const quotation = query.data;
  const [editing, setEditing] = useState(isCreating);
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();
  const statusMutation = useUpdateQuotationStatus();
  const conversion = useConvertQuotation();
  const documents = useQuotationDocumentPreview();
  const editor = useQuotationEditor({
    quotation,
    editable: editing,
    persistNewDraft: isCreating,
  });
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (!isCreating && query.isPending) return <CenteredSpinner />;
  if (!isCreating && (query.isError || !quotation)) {
    return (
      <ApiErrorAlert
        title="Impossible de charger la soumission."
        error={query.error}
      />
    );
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const request = editor.buildRequest();
      const saved = isCreating
        ? await createMutation.mutateAsync(request)
        : await updateMutation.mutateAsync({
            quotationId: quotationId!,
            request,
          });
      editor.resetFromQuotation(saved);
      setEditing(false);
      toast.success(
        isCreating ? "Soumission créée." : "Soumission enregistrée.",
      );
      if (isCreating) {
        editor.resetNewDraft();
        void navigate(`/quotations/${saved.id}`, { replace: true });
      }
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    }
  }

  async function changeStatus(status: QuotationStatus) {
    try {
      await statusMutation.mutateAsync({ quotationId: quotationId!, status });
      toast.success("Statut de la soumission mis à jour.");
    } catch (cause) {
      toast.error("Impossible de changer le statut de la soumission.", {
        description: getApiErrorMessage(cause),
      });
    }
  }

  async function convert() {
    try {
      const result = await conversion.mutateAsync(quotationId!);
      toast.success("Commande créée à partir de la soumission acceptée.");
      void navigate(`/orders/${result.orderId}`);
    } catch (cause) {
      toast.error("Impossible de convertir la soumission en commande.", {
        description: getApiErrorMessage(cause),
      });
    }
  }

  function cancelEditing() {
    setError(null);
    if (isCreating) {
      void navigate("/sales/quotations");
    } else if (quotation) {
      editor.resetFromQuotation(quotation);
      setEditing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="text-sm text-muted-foreground hover:underline"
            to="/sales/quotations"
          >
            ← Toutes les soumissions
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {isCreating ? "Nouvelle soumission" : quotation?.quotationNumber}
            </h1>
            {quotation ? (
              <QuotationStatusBadge status={quotation.status} />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {quotation
              ? `Créée le ${formatOrderDate(quotation.createdAt)} · valide jusqu’au ${formatDateOnly(quotation.validUntil)}`
              : "Offre commerciale indépendante d’une commande"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                form="quotation-editor-form"
                disabled={isSaving}
              >
                {isSaving ? <Spinner /> : null}
                {isCreating ? "Créer la soumission" : "Enregistrer"}
              </Button>
            </>
          ) : quotation ? (
            <QuotationActions
              quotation={quotation}
              busy={
                statusMutation.isPending ||
                conversion.isPending ||
                documents.isPending
              }
              onEdit={() => setEditing(true)}
              onStatus={(status) => void changeStatus(status)}
              onConvert={() => void convert()}
              onOpen={() => void documents.open(quotation.id)}
            />
          ) : null}
        </div>
      </div>

      {editing ? (
        editor.isLoadingSelectedProducts ? (
          <CenteredSpinner />
        ) : (
          <form
            id="quotation-editor-form"
            onSubmit={(event) => void save(event)}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Conditions de la soumission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-sm space-y-2">
                  <Label htmlFor="quotation-valid-until">Valide jusqu’au</Label>
                  <Input
                    id="quotation-valid-until"
                    type="date"
                    required
                    value={editor.draft.validUntil}
                    onChange={(event) =>
                      editor.setDraft({
                        ...editor.draft,
                        validUntil: event.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
            {editor.selectedProductsError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                Certains produits ne sont plus disponibles dans le catalogue.
              </p>
            ) : null}
            <OrderEditorForm
              draft={editor.draft.commercial}
              products={editor.products}
              searchResults={editor.searchResults}
              productSearch={editor.productSearch}
              isSearchingProducts={editor.isSearchingProducts}
              isProductSearchError={editor.isProductSearchError}
              error={error}
              onDraftChange={editor.setCommercial}
              onProductSearchChange={editor.setProductSearch}
              onAddProduct={editor.addProduct}
              onPatchItem={editor.patchItem}
              onRemoveItem={editor.removeItem}
              documentContext="soumission"
            />
          </form>
        )
      ) : quotation ? (
        <QuotationReadOnly quotation={quotation} />
      ) : null}
    </div>
  );
}

function QuotationActions({
  quotation,
  busy,
  onEdit,
  onStatus,
  onConvert,
  onOpen,
}: {
  quotation: Quotation;
  busy: boolean;
  onEdit: () => void;
  onStatus: (status: QuotationStatus) => void;
  onConvert: () => void;
  onOpen: () => void;
}) {
  return (
    <>
      <Button type="button" variant="outline" disabled={busy} onClick={onOpen}>
        <HugeiconsIcon icon={FileViewIcon} strokeWidth={2} />
        Voir PDF
      </Button>
      {quotation.status === "DRAFT" ? (
        <>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onEdit}
          >
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            Modifier
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => onStatus("SENT")}
          >
            <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
            Marquer envoyée
          </Button>
        </>
      ) : null}
      {quotation.status === "SENT" ? (
        <>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onStatus("REJECTED")}
          >
            <HugeiconsIcon icon={UnavailableIcon} strokeWidth={2} />
            Rejeter
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => onStatus("ACCEPTED")}
          >
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
            Accepter
          </Button>
        </>
      ) : null}
      {quotation.status === "ACCEPTED" ? (
        quotation.convertedOrderId ? (
          <Button asChild variant="outline">
            <Link to={`/orders/${quotation.convertedOrderId}`}>
              <HugeiconsIcon icon={ShoppingCart02Icon} strokeWidth={2} />
              Voir la commande
            </Link>
          </Button>
        ) : (
          <Button type="button" disabled={busy} onClick={onConvert}>
            <HugeiconsIcon icon={ShoppingCart02Icon} strokeWidth={2} />
            Convertir en commande
          </Button>
        )
      ) : null}
    </>
  );
}

function QuotationReadOnly({ quotation }: { quotation: Quotation }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Client et conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Info label="Nom" value={quotation.customerName} />
              <Info
                label="Téléphone"
                value={formatPhoneForDisplay(quotation.customerPhone)}
              />
              <Info label="Courriel" value={quotation.customerEmail ?? "—"} />
              <Info
                label="Adresse"
                value={formatOrderAddress(quotation.customerAddress)}
              />
              <Info
                label="Valide jusqu’au"
                value={formatDateOnly(quotation.validUntil)}
              />
              <Info label="Notes" value={quotation.note ?? "—"} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <Amount label="Sous-total" cents={quotation.subtotalCents} />
              {quotation.discountCents > 0 ? (
                <Amount label="Rabais" cents={-quotation.discountCents} />
              ) : null}
              {quotation.deliveryFeeCents > 0 ? (
                <Amount label="Livraison" cents={quotation.deliveryFeeCents} />
              ) : null}
              <Amount label="Total" cents={quotation.totalCents} emphasized />
            </dl>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Articles ({quotation.items.length})
        </h2>
        <OrderItemsDetails items={quotation.items} />
      </div>
    </>
  );
}

function CenteredSpinner() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <Spinner />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium whitespace-pre-line">{value}</dd>
    </div>
  );
}

function Amount({
  label,
  cents,
  emphasized = false,
}: {
  label: string;
  cents: number;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={emphasized ? "text-2xl font-semibold" : "font-medium"}>
        {formatOrderCurrency(cents)}
      </dd>
    </div>
  );
}
