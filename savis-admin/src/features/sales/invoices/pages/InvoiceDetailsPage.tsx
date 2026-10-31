import { OrderItemsDetails } from "@/features/sales/orders/components/OrderItemsDetails";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import {
  formatOrderAddress,
  formatPhoneForDisplay,
} from "@/features/sales/orders/model/contactFormat";
import {
  formatOrderCurrency,
  formatOrderDate,
} from "@/features/sales/orders/types";
import { getApiErrorMessage } from "@/shared/api/apiError";
import { dollarsToSafeCents } from "@/shared/lib/money";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import {
  Edit02Icon,
  FileViewIcon,
  SentIcon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { InvoiceStatusBadge } from "../components/InvoiceStatusBadge";
import {
  useCancelInvoice,
  useInvoice,
  useInvoiceDocumentPreview,
  useIssueInvoice,
  useUpdateInvoice,
} from "../hooks/useInvoiceApi";
import type { Invoice, UpdateInvoiceRequest } from "../types";
import { invoiceDisplayNumber } from "../types";

type DraftForm = Omit<
  UpdateInvoiceRequest,
  "discountCents" | "deliveryFeeCents" | "gstCents" | "qstCents"
> & {
  discount: string;
  deliveryFee: string;
  gst: string;
  qst: string;
};

export function InvoiceDetailsPage() {
  const { invoiceId } = useParams();
  const query = useInvoice(invoiceId);
  const invoice = query.data;
  const updateMutation = useUpdateInvoice();
  const issueMutation = useIssueInvoice();
  const cancelMutation = useCancelInvoice();
  const documents = useInvoiceDocumentPreview();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DraftForm | null>(null);

  if (query.isPending) return <CenteredSpinner />;
  if (query.isError || !invoice) {
    return (
      <ApiErrorAlert
        title="Impossible de charger la facture."
        error={query.error}
      />
    );
  }
  const currentInvoice = invoice;

  const busy =
    updateMutation.isPending ||
    issueMutation.isPending ||
    cancelMutation.isPending ||
    documents.isPending;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    const currentForm = form;
    try {
      await updateMutation.mutateAsync({
        invoiceId: invoiceId!,
        request: {
          customerName: currentForm.customerName,
          customerPhone: currentForm.customerPhone,
          customerEmail: emptyToNull(currentForm.customerEmail),
          customerAddress: emptyAddressToNull(currentForm.customerAddress),
          note: emptyToNull(currentForm.note),
          discountCents: toCents(currentForm.discount),
          deliveryFeeCents: toCents(currentForm.deliveryFee),
          gstCents: toCents(currentForm.gst),
          qstCents: toCents(currentForm.qst),
        },
      });
      setEditing(false);
      toast.success("Facture brouillon enregistrée.");
    } catch (error) {
      toast.error("Impossible d’enregistrer la facture.", {
        description: getApiErrorMessage(error),
      });
    }
  }

  async function issue() {
    if (
      !window.confirm(
        "Émettre cette facture et figer définitivement ses montants ?",
      )
    )
      return;
    try {
      await issueMutation.mutateAsync(currentInvoice.id);
      toast.success("Facture émise.");
    } catch (error) {
      toast.error("Impossible d’émettre la facture.", {
        description: getApiErrorMessage(error),
      });
    }
  }

  async function cancel() {
    if (
      !window.confirm(
        "Annuler cette facture ? Cette action ne crée pas de note de crédit.",
      )
    )
      return;
    try {
      await cancelMutation.mutateAsync(currentInvoice.id);
      setEditing(false);
      toast.success("Facture annulée.");
    } catch (error) {
      toast.error("Impossible d’annuler la facture.", {
        description: getApiErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="text-sm text-muted-foreground hover:underline"
            to="/sales/invoices"
          >
            ← Toutes les factures
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {invoiceDisplayNumber(invoice)}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Créée le {formatOrderDate(invoice.createdAt)} · commande{" "}
            <Link
              className="hover:underline"
              to={`/orders/${invoice.sourceOrderId}`}
            >
              {invoice.sourceOrderNumber}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setForm(null);
                  setEditing(false);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" form="invoice-form" disabled={busy}>
                {updateMutation.isPending ? <Spinner /> : null}
                Enregistrer
              </Button>
            </>
          ) : (
            <>
              {invoice.invoiceNumber ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void documents.open(invoice.id)}
                >
                  {documents.isPending ? (
                    <Spinner />
                  ) : (
                    <HugeiconsIcon icon={FileViewIcon} strokeWidth={2} />
                  )}
                  Voir PDF
                </Button>
              ) : null}
              {invoice.status === "DRAFT" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setForm(toForm(invoice));
                      setEditing(true);
                    }}
                  >
                    <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void issue()}
                  >
                    <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
                    Émettre
                  </Button>
                </>
              ) : null}
              {invoice.status !== "CANCELLED" ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => void cancel()}
                >
                  <HugeiconsIcon icon={UnavailableIcon} strokeWidth={2} />
                  Annuler la facture
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {editing && form ? (
        <InvoiceEditor form={form} onChange={setForm} onSubmit={save} />
      ) : (
        <InvoiceReadOnly invoice={invoice} />
      )}
    </div>
  );
}

function InvoiceEditor({
  form,
  onChange,
  onSubmit,
}: {
  form: DraftForm;
  onChange: (form: DraftForm) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const field = (name: keyof DraftForm, value: string) =>
    onChange({ ...form, [name]: value });
  const address = form.customerAddress ?? {
    line1: "",
    line2: "",
    city: "",
    province: "QC",
    postalCode: "",
  };
  const addressField = (name: keyof typeof address, value: string) =>
    onChange({ ...form, customerAddress: { ...address, [name]: value } });

  return (
    <form id="invoice-form" className="space-y-4" onSubmit={onSubmit}>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nom"
            required
            value={form.customerName}
            onChange={(v) => field("customerName", v)}
          />
          <Field
            label="Téléphone"
            required
            type="tel"
            value={form.customerPhone}
            onChange={(v) => field("customerPhone", v)}
          />
          <Field
            label="Courriel"
            type="email"
            value={form.customerEmail ?? ""}
            onChange={(v) => field("customerEmail", v)}
          />
          <Field
            label="Adresse"
            value={address.line1 ?? ""}
            onChange={(v) => addressField("line1", v)}
          />
          <Field
            label="Complément"
            value={address.line2 ?? ""}
            onChange={(v) => addressField("line2", v)}
          />
          <Field
            label="Ville"
            value={address.city ?? ""}
            onChange={(v) => addressField("city", v)}
          />
          <Field
            label="Province"
            value={address.province ?? ""}
            onChange={(v) => addressField("province", v)}
          />
          <Field
            label="Code postal"
            value={address.postalCode ?? ""}
            onChange={(v) => addressField("postalCode", v)}
          />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="invoice-note">Notes</Label>
            <Textarea
              id="invoice-note"
              value={form.note ?? ""}
              onChange={(e) => field("note", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Ajustements et taxes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MoneyField
            label="Rabais"
            value={form.discount}
            onChange={(v) => field("discount", v)}
          />
          <MoneyField
            label="Livraison"
            value={form.deliveryFee}
            onChange={(v) => field("deliveryFee", v)}
          />
          <MoneyField
            label="TPS"
            value={form.gst}
            onChange={(v) => field("gst", v)}
          />
          <MoneyField
            label="TVQ"
            value={form.qst}
            onChange={(v) => field("qst", v)}
          />
        </CardContent>
      </Card>
    </form>
  );
}

function InvoiceReadOnly({ invoice }: { invoice: Invoice }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Info label="Nom" value={invoice.customerName} />
              <Info
                label="Téléphone"
                value={formatPhoneForDisplay(invoice.customerPhone)}
              />
              <Info label="Courriel" value={invoice.customerEmail ?? "—"} />
              <Info
                label="Adresse"
                value={formatOrderAddress(invoice.customerAddress)}
              />
              <Info label="Notes" value={invoice.note ?? "—"} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <Amount label="Sous-total" cents={invoice.subtotalCents} />
              {invoice.discountCents ? (
                <Amount label="Rabais" cents={-invoice.discountCents} />
              ) : null}
              {invoice.deliveryFeeCents ? (
                <Amount label="Livraison" cents={invoice.deliveryFeeCents} />
              ) : null}
              {invoice.gstCents ? (
                <Amount label="TPS" cents={invoice.gstCents} />
              ) : null}
              {invoice.qstCents ? (
                <Amount label="TVQ" cents={invoice.qstCents} />
              ) : null}
              <Amount label="Total" cents={invoice.totalCents} emphasized />
            </dl>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Articles ({invoice.items.length})
        </h2>
        <OrderItemsDetails items={invoice.items} />
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  const id = `invoice-${label.toLowerCase().replace(/\s/g, "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const fieldLabel = `${label} (CAD)`;
  const id = `invoice-${label.toLowerCase().replace(/\s/g, "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{fieldLabel}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={emphasized ? "text-2xl font-semibold" : "font-medium"}>
        {formatOrderCurrency(cents)}
      </dd>
    </div>
  );
}

function CenteredSpinner() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <Spinner />
    </div>
  );
}

function toForm(invoice: Invoice): DraftForm {
  return {
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone,
    customerEmail: invoice.customerEmail,
    customerAddress: invoice.customerAddress,
    note: invoice.note,
    discount: fromCents(invoice.discountCents),
    deliveryFee: fromCents(invoice.deliveryFeeCents),
    gst: fromCents(invoice.gstCents),
    qst: fromCents(invoice.qstCents),
  };
}

const fromCents = (cents: number) => (cents / 100).toFixed(2);
const toCents = (value: string) => dollarsToSafeCents(Number(value || 0));
const emptyToNull = (value: string | null) => value?.trim() || null;
const emptyAddressToNull = (
  address: UpdateInvoiceRequest["customerAddress"],
) =>
  address && Object.values(address).some((value) => value?.trim())
    ? address
    : null;
