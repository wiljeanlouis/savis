import { NoData } from "@/shared/components/NoData";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { OrdersTable } from "../components/OrdersTable";
import { useOrderManagement } from "../hooks/useOrderManagement";

export function OrdersPage() {
  const { orders, isLoading, isError, error, isImporting, retrieveWebOrders } =
    useOrderManagement();

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
          <Button asChild variant="outline">
            <Link to="/orders/new">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Nouvelle commande
            </Link>
          </Button>
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
        <ApiErrorAlert
          title="Impossible de charger les commandes."
          error={error}
        />
      ) : orders.length === 0 ? (
        <NoData />
      ) : (
        <OrdersTable orders={orders} />
      )}
    </div>
  );
}
