import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Download01Icon,
  Pdf01Icon,
} from "@hugeicons/core-free-icons";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { OrderItemsDetails } from "../components/OrderItemsDetails";
import { OrderRequirementReportCard } from "../components/OrderRequirementReportCard";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { OrderStatusSelect } from "../components/OrderStatusSelect";
import {
  useOrder,
  useOrderDocumentDownload,
  useOrderRequirementReport,
  useUpdateOrderStatus,
} from "../hooks/useOrderApi";
import type { OrderDocumentType, OrderStatus } from "../types";
import {
  formatOrderCurrency,
  formatOrderDate,
  orderSourceLabels,
} from "../types";

export function OrderDetailsPage() {
  const { orderId } = useParams();
  const orderQuery = useOrder(orderId);
  const requirementsQuery = useOrderRequirementReport(orderId);
  const statusMutation = useUpdateOrderStatus();
  const documents = useOrderDocumentDownload();

  async function changeStatus(status: OrderStatus) {
    if (!orderId) return;
    try {
      await statusMutation.mutateAsync({ orderId, status });
      toast.success("Statut de la commande mis à jour.");
    } catch (error) {
      const response = error as {
        response?: { data?: { detail?: string } };
      };
      toast.error("Impossible de changer le statut.", {
        description: response.response?.data?.detail,
      });
    }
  }

  async function downloadDocument(documentType: OrderDocumentType) {
    if (!orderId) return;
    await documents.download(orderId, documentType);
  }

  if (orderQuery.isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (orderQuery.isError || !orderQuery.data) {
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
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="text-sm text-muted-foreground hover:underline"
            to="/orders"
          >
            ← Toutes les commandes
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatOrderDate(order.placedAt)} ·{" "}
            {orderSourceLabels[order.source]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={documents.isPending}>
                {documents.isPending ? (
                  <Spinner />
                ) : (
                  <HugeiconsIcon icon={Pdf01Icon} strokeWidth={2} />
                )}
                Documents PDF
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuItem onClick={() => void downloadDocument("quote")}>
                <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
                Télécharger la soumission
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void downloadDocument("invoice")}
              >
                <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
                Télécharger la facture
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <OrderStatusSelect
            status={order.status}
            disabled={statusMutation.isPending}
            onChange={(status) => void changeStatus(status)}
          />
        </div>
      </div>

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
              Prix figé lors de la création de la commande.
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
            {requirementsQuery.data ? (
              <span className="rounded-full bg-muted-foreground/15 px-1.5 text-xs tabular-nums">
                {requirementsQuery.data.requirements.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <OrderItemsDetails items={order.items} />
        </TabsContent>

        <TabsContent value="requirements">
          <OrderRequirementReportCard
            report={requirementsQuery.data}
            isLoading={requirementsQuery.isPending}
            isError={requirementsQuery.isError}
          />
        </TabsContent>
      </Tabs>
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
  return [address.line1, address.line2, locality].filter(Boolean).join(", ");
}
