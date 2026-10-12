import { NoData } from "@/shared/components/NoData";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { CreateOrderDialog } from "../components/CreateOrderDialog";
import { OrdersTable } from "../components/OrdersTable";
import { useOrderDocumentDownload } from "../hooks/useOrderApi";
import { useOrderManagement } from "../hooks/useOrderManagement";

export function OrdersPage() {
  const documents = useOrderDocumentDownload();
  const {
    orders,
    isLoading,
    isError,
    isImporting,
    isCreating,
    createAdminOrder,
    retrieveWebOrders,
  } = useOrderManagement();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Commandes</h1>
          <p className="text-sm text-muted-foreground">
            Saisie administrative et import manuel des commandes web.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CreateOrderDialog
            isCreating={isCreating}
            onCreate={createAdminOrder}
          />
          <Button
            disabled={isImporting}
            onClick={() => void retrieveWebOrders()}
          >
            {isImporting ? "Récupération…" : "Récupérer commandes web"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          Impossible de charger les commandes.
        </p>
      ) : orders.length === 0 ? (
        <NoData />
      ) : (
        <OrdersTable
          orders={orders}
          downloadingOrderId={
            documents.isPending ? documents.pendingOrderId : undefined
          }
          onDownloadDocument={(orderId, documentType) =>
            void documents.download(orderId, documentType)
          }
        />
      )}
    </div>
  );
}
