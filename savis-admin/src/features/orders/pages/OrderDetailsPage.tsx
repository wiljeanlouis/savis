import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Spinner } from "@/shared/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  ArrowDown01Icon,
  Download01Icon,
  Edit02Icon,
  Pdf01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useBlocker, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { OrderEditorForm } from "../components/OrderEditorForm";
import { OrderItemsDetails } from "../components/OrderItemsDetails";
import { OrderRequirementReportCard } from "../components/OrderRequirementReportCard";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { OrderStatusSelect } from "../components/OrderStatusSelect";
import { useOrderEditor } from "../hooks/useOrderEditor";
import {
  useCreateOrder,
  useOrder,
  useOrderDocumentDownload,
  useOrderRequirementReport,
  useUpdateOrder,
  useUpdateOrderStatus,
} from "../hooks/useOrderApi";
import type {
  Order,
  OrderDocumentType,
  OrderRequirementReport,
  OrderStatus,
} from "../types";
import {
  formatOrderCurrency,
  formatOrderDate,
  orderSourceLabels,
} from "../types";

export function OrderDetailsPage() {
  const { orderId } = useParams();
  return <OrderDetailsContent key={orderId ?? "new"} orderId={orderId} />;
}

function OrderDetailsContent({ orderId }: { orderId: string | undefined }) {
  const navigate = useNavigate();
  const isCreating = !orderId;
  const orderQuery = useOrder(orderId);
  const requirementsQuery = useOrderRequirementReport(orderId);
  const createMutation = useCreateOrder();
  const updateMutation = useUpdateOrder();
  const statusMutation = useUpdateOrderStatus();
  const documents = useOrderDocumentDownload();
  const [isEditing, setIsEditing] = useState(isCreating);
  const [editorError, setEditorError] = useState<string | null>(null);
  const allowNavigation = useRef(false);
  const editor = useOrderEditor({
    order: orderQuery.data,
    editable: isEditing,
    persistNewDraft: isCreating,
  });
  const hasUnsavedChanges = isEditing && editor.isDirty;
  const blocker = useBlocker(
    () => hasUnsavedChanges && !allowNavigation.current,
  );

  useEffect(() => {
    allowNavigation.current = false;
  }, [orderId]);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("Abandonner les modifications non enregistrées ?")) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", preventUnload);
    return () => window.removeEventListener("beforeunload", preventUnload);
  }, [hasUnsavedChanges]);

  async function changeStatus(status: OrderStatus) {
    if (!orderId) return;
    try {
      await statusMutation.mutateAsync({ orderId, status });
      toast.success("Statut de la commande mis à jour.");
    } catch (error) {
      toast.error("Impossible de changer le statut.", {
        description: problemDetail(error),
      });
    }
  }

  async function downloadDocument(documentType: OrderDocumentType) {
    if (orderId) await documents.download(orderId, documentType);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditorError(null);
    try {
      const request = editor.buildRequest();
      if (isCreating) {
        const created = await createMutation.mutateAsync(request);
        editor.resetNewDraft();
        allowNavigation.current = true;
        toast.success("Commande créée.");
        navigate(`/orders/${created.id}`, { replace: true });
      } else if (orderId) {
        const updated = await updateMutation.mutateAsync({ orderId, request });
        editor.resetFromOrder(updated);
        setIsEditing(false);
        toast.success("Commande mise à jour.");
      }
    } catch (error) {
      const detail = message(error);
      setEditorError(detail);
      toast.error(
        isCreating
          ? "Impossible de créer la commande."
          : "Impossible de modifier la commande.",
        {
          description: detail,
        },
      );
    }
  }

  function cancelEditing() {
    if (
      editor.isDirty &&
      !window.confirm("Abandonner les modifications non enregistrées ?")
    ) {
      return;
    }
    setEditorError(null);
    if (isCreating) {
      editor.resetNewDraft();
      allowNavigation.current = true;
      navigate("/orders");
    } else if (orderQuery.data) {
      editor.resetFromOrder(orderQuery.data);
      setIsEditing(false);
    }
  }

  function returnToOrders() {
    if (
      hasUnsavedChanges &&
      !window.confirm("Abandonner les modifications non enregistrées ?")
    ) {
      return;
    }
    if (isCreating) editor.resetNewDraft();
    allowNavigation.current = true;
    navigate("/orders");
  }

  if (!isCreating && orderQuery.isPending) return <CenteredSpinner />;
  if (!isCreating && (orderQuery.isError || !orderQuery.data)) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Commande introuvable.</p>
        <Button asChild variant="outline">
          <Link to="/orders">Retour aux commandes</Link>
        </Button>
      </div>
    );
  }

  const order = orderQuery.data;
  const canEdit = order?.source === "ADMIN" && order.status === "NEW";
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            className="text-sm text-muted-foreground hover:underline"
            type="button"
            onClick={returnToOrders}
          >
            ← Toutes les commandes
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {isCreating ? "Nouvelle commande" : order?.orderNumber}
            </h1>
            {order ? <OrderStatusBadge status={order.status} /> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {order
              ? `${formatOrderDate(order.placedAt)} · ${orderSourceLabels[order.source]}`
              : "Saisie administrative"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <>
              <Button
                key="cancel-editing"
                type="button"
                variant="outline"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                key="save-order"
                type="submit"
                form="order-editor-form"
                disabled={isSaving}
              >
                {isSaving ? <Spinner /> : null}
                {isCreating ? "Créer la commande" : "Enregistrer"}
              </Button>
            </>
          ) : order ? (
            <>
              <DocumentMenu
                isPending={documents.isPending}
                onDownload={downloadDocument}
              />
              {canEdit ? (
                <Button
                  key="edit-order"
                  type="button"
                  variant="outline"
                  onClick={(event) => {
                    event.preventDefault();
                    setIsEditing(true);
                  }}
                >
                  <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                  Modifier
                </Button>
              ) : null}
              <OrderStatusSelect
                status={order.status}
                disabled={statusMutation.isPending}
                onChange={(status) => void changeStatus(status)}
              />
            </>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        editor.isLoadingSelectedProducts ? (
          <CenteredSpinner />
        ) : (
          <div className="space-y-4">
            {editor.selectedProductsError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                Certains produits enregistrés ne sont plus disponibles dans le
                catalogue. Retirez-les avant d’enregistrer la commande.
              </p>
            ) : null}
            <form id="order-editor-form" onSubmit={(event) => void save(event)}>
              <OrderEditorForm
                draft={editor.draft}
                products={editor.products}
                searchResults={editor.searchResults}
                productSearch={editor.productSearch}
                isSearchingProducts={editor.isSearchingProducts}
                isProductSearchError={editor.isProductSearchError}
                error={editorError}
                onDraftChange={editor.setDraft}
                onProductSearchChange={editor.setProductSearch}
                onAddProduct={editor.addProduct}
                onPatchItem={editor.patchItem}
                onRemoveItem={editor.removeItem}
              />
            </form>
          </div>
        )
      ) : order ? (
        <OrderReadOnlyContent
          order={order}
          requirements={requirementsQuery.data}
          requirementsPending={requirementsQuery.isPending}
          requirementsError={requirementsQuery.isError}
        />
      ) : null}
    </div>
  );
}

function DocumentMenu({
  isPending,
  onDownload,
}: {
  isPending: boolean;
  onDownload: (documentType: OrderDocumentType) => Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" disabled={isPending}>
          {isPending ? (
            <Spinner />
          ) : (
            <HugeiconsIcon icon={Pdf01Icon} strokeWidth={2} />
          )}
          Documents PDF
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem onClick={() => void onDownload("quote")}>
          <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
          Télécharger la soumission
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void onDownload("invoice")}>
          <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
          Télécharger la facture
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OrderReadOnlyContent({
  order,
  requirements,
  requirementsPending,
  requirementsError,
}: {
  order: Order;
  requirements: OrderRequirementReport | undefined;
  requirementsPending: boolean;
  requirementsError: boolean;
}) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Info label="Nom" value={order.customerName} />
              <Info label="Téléphone" value={order.customerPhone} />
              <Info label="Courriel" value={order.customerEmail ?? "—"} />
              <Info
                label="Adresse"
                value={formatAddress(order.customerAddress)}
              />
              <Info label="Note" value={order.note ?? "—"} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <Amount label="Sous-total" cents={order.subtotalCents} />
              {order.discountCents > 0 ? (
                <Amount label="Rabais" cents={-order.discountCents} />
              ) : null}
              {order.deliveryFeeCents > 0 ? (
                <Amount label="Livraison" cents={order.deliveryFeeCents} />
              ) : null}
              <Amount label="Total" cents={order.totalCents} emphasized />
            </dl>
            <p className="mt-2 text-muted-foreground">
              Prix figé lors de la dernière sauvegarde.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items" className="gap-4">
        <TabsList className="h-10 w-full sm:w-fit">
          <TabsTrigger value="items" className="px-4 text-sm">
            Articles ({order.items.length})
          </TabsTrigger>
          <TabsTrigger value="requirements" className="px-4 text-sm">
            Besoins de production
            {requirements ? (
              <span className="rounded-full bg-muted-foreground/15 px-1.5 text-xs tabular-nums">
                {requirements.requirements.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="items">
          <OrderItemsDetails items={order.items} />
        </TabsContent>
        <TabsContent value="requirements">
          <OrderRequirementReportCard
            report={requirements}
            isLoading={requirementsPending}
            isError={requirementsError}
          />
        </TabsContent>
      </Tabs>
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
      <dd className="mt-1 font-medium">{value}</dd>
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

function formatAddress(address: import("../types").OrderAddress | null) {
  if (!address) return "—";
  const locality = [address.city, address.province, address.postalCode]
    .filter(Boolean)
    .join(" ");
  return (
    [address.line1, address.line2, locality].filter(Boolean).join(", ") || "—"
  );
}

function problemDetail(error: unknown) {
  return (error as { response?: { data?: { detail?: string } } }).response?.data
    ?.detail;
}

function message(error: unknown) {
  return (
    problemDetail(error) ??
    (error instanceof Error
      ? error.message
      : "Une erreur inattendue est survenue.")
  );
}
