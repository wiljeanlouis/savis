import { useEffect, useRef, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "@/shared/api/apiError";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Edit02Icon, Money03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useBlocker, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useCreateInvoice } from "@/features/sales/invoices/hooks/useInvoiceApi";
import {
  OrderCustomerEditor,
  OrderEditorForm,
} from "../components/OrderEditorForm";
import { OrderItemsDetails } from "../components/OrderItemsDetails";
import { OrderRequirementReportCard } from "../components/OrderRequirementReportCard";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { OrderStatusSelect } from "../components/OrderStatusSelect";
import { useOrderEditor } from "../hooks/useOrderEditor";
import {
  useCreateOrder,
  useOrder,
  useOrderRequirementReport,
  useUpdateOrder,
  useUpdateOrderCustomer,
  useUpdateOrderStatus,
} from "../hooks/useOrderApi";
import { buildUpdateOrderCustomerRequest } from "../model/adminOrderDraft";
import {
  formatOrderAddress,
  formatPhoneForDisplay,
} from "../model/contactFormat";
import type { Order, OrderRequirementReport, OrderStatus } from "../types";
import {
  formatOrderCurrency,
  formatOrderDate,
  orderSourceLabels,
} from "../types";

type OrderEditMode = "full" | "customer" | null;

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
  const customerMutation = useUpdateOrderCustomer();
  const statusMutation = useUpdateOrderStatus();
  const invoiceCreation = useCreateInvoice();
  const [editMode, setEditMode] = useState<OrderEditMode>(
    isCreating ? "full" : null,
  );
  const isEditing = editMode !== null;
  const [editorError, setEditorError] = useState<string | null>(null);
  const allowNavigation = useRef(false);
  const editor = useOrderEditor({
    order: orderQuery.data,
    editable: editMode === "full",
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
        description: getApiErrorMessage(error),
      });
    }
  }

  async function createInvoice() {
    if (!orderId) return;
    try {
      const invoice = await invoiceCreation.mutateAsync(orderId);
      toast.success("Facture brouillon prête.");
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      toast.error("Impossible de créer la facture.", {
        description: getApiErrorMessage(error),
      });
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditorError(null);
    try {
      if (isCreating) {
        const request = editor.buildRequest();
        const created = await createMutation.mutateAsync(request);
        editor.resetNewDraft();
        allowNavigation.current = true;
        toast.success("Commande créée.");
        navigate(`/orders/${created.id}`, { replace: true });
      } else if (orderId && editMode === "customer") {
        const updated = await customerMutation.mutateAsync({
          orderId,
          request: buildUpdateOrderCustomerRequest(editor.draft),
        });
        editor.resetFromOrder(updated);
        setEditMode(null);
        toast.success("Coordonnées du client mises à jour.");
      } else if (orderId) {
        const request = editor.buildRequest();
        const updated = await updateMutation.mutateAsync({ orderId, request });
        editor.resetFromOrder(updated);
        setEditMode(null);
        toast.success("Commande mise à jour.");
      }
    } catch (error) {
      const detail = getApiErrorMessage(error);
      setEditorError(detail);
      toast.error(
        isCreating
          ? "Impossible de créer la commande."
          : editMode === "customer"
            ? "Impossible de modifier les coordonnées du client."
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
      navigate("/sales/orders");
    } else if (orderQuery.data) {
      editor.resetFromOrder(orderQuery.data);
      setEditMode(null);
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
    navigate("/sales/orders");
  }

  if (!isCreating && orderQuery.isPending) return <CenteredSpinner />;
  if (!isCreating && (orderQuery.isError || !orderQuery.data)) {
    return (
      <div className="space-y-4">
        <ApiErrorAlert
          title="Impossible de charger la commande."
          error={orderQuery.error}
        />
        <Button asChild variant="outline">
          <Link to="/sales/orders">Retour aux commandes</Link>
        </Button>
      </div>
    );
  }

  const order = orderQuery.data;
  const canEdit = order?.source === "ADMIN" && order.status === "NEW";
  const canEditWebCustomer =
    order?.source === "SAVOURETPLUS_WEB" && order.status === "NEW";
  const canInvoice =
    order &&
    ["ACCEPTED", "IN_PREPARATION", "READY", "COMPLETED"].includes(order.status);
  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    customerMutation.isPending;

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
                {isCreating
                  ? "Créer la commande"
                  : editMode === "customer"
                    ? "Enregistrer le client"
                    : "Enregistrer"}
              </Button>
            </>
          ) : order ? (
            <>
              {canInvoice ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={invoiceCreation.isPending}
                  onClick={() => void createInvoice()}
                >
                  {invoiceCreation.isPending ? (
                    <Spinner />
                  ) : (
                    <HugeiconsIcon icon={Money03Icon} strokeWidth={2} />
                  )}
                  Créer ou voir la facture
                </Button>
              ) : null}
              {canEdit ? (
                <Button
                  key="edit-order"
                  type="button"
                  variant="outline"
                  onClick={(event) => {
                    event.preventDefault();
                    setEditMode("full");
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

      {editMode === "customer" ? (
        <form id="order-editor-form" onSubmit={(event) => void save(event)}>
          <div className="space-y-4">
            <OrderCustomerEditor
              draft={editor.draft}
              onDraftChange={editor.setDraft}
            />
            {editorError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                {editorError}
              </p>
            ) : null}
          </div>
        </form>
      ) : editMode === "full" ? (
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
          canEditCustomer={canEditWebCustomer}
          onEditCustomer={() => setEditMode("customer")}
        />
      ) : null}
    </div>
  );
}

function OrderReadOnlyContent({
  order,
  requirements,
  requirementsPending,
  requirementsError,
  canEditCustomer,
  onEditCustomer,
}: {
  order: Order;
  requirements: OrderRequirementReport | undefined;
  requirementsPending: boolean;
  requirementsError: boolean;
  canEditCustomer: boolean;
  onEditCustomer: () => void;
}) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between border-b">
            <CardTitle>Client</CardTitle>
            {canEditCustomer ? (
              <Button type="button" variant="outline" onClick={onEditCustomer}>
                <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                Modifier le client
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Info label="Nom" value={order.customerName} />
              <Info
                label="Téléphone"
                value={formatPhoneForDisplay(order.customerPhone)}
              />
              <Info label="Courriel" value={order.customerEmail ?? "—"} />
              <Info
                label="Adresse"
                value={formatOrderAddress(order.customerAddress)}
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
