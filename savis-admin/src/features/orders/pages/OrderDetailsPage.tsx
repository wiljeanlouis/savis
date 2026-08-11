import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { OrderItemsDetails } from "../components/OrderItemsDetails";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { OrderStatusSelect } from "../components/OrderStatusSelect";
import { useOrder, useUpdateOrderStatus } from "../hooks/useOrderApi";
import type { OrderStatus } from "../types";
import {
  formatOrderCurrency,
  formatOrderDate,
  orderSourceLabels,
} from "../types";

export function OrderDetailsPage() {
  const { orderId } = useParams();
  const orderQuery = useOrder(orderId);
  const statusMutation = useUpdateOrderStatus();

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
        <OrderStatusSelect
          status={order.status}
          disabled={statusMutation.isPending}
          onChange={(status) => void changeStatus(status)}
        />
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
              <Info label="Note" value={order.note ?? "—"} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatOrderCurrency(order.totalCents)}
            </p>
            <p className="mt-2 text-muted-foreground">
              Prix figé lors de la création de la commande.
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Articles</h2>
        <OrderItemsDetails items={order.items} />
      </section>
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
