import { toast } from "sonner";
import type { CreateOrderRequest } from "../types";
import { useCreateOrder, useImportOrders, useOrders } from "./useOrderApi";

export function useOrderManagement() {
  const orders = useOrders();
  const importer = useImportOrders();
  const creator = useCreateOrder();

  async function createAdminOrder(request: CreateOrderRequest) {
    try {
      const order = await creator.mutateAsync(request);
      toast.success(`Commande ${order.orderNumber} créée avec succès.`);
      return true;
    } catch (error) {
      const response = error as {
        response?: { data?: { detail?: string } };
      };
      toast.error("Impossible de créer la commande.", {
        description: response.response?.data?.detail,
      });
      return false;
    }
  }

  async function retrieveWebOrders() {
    try {
      const result = await importer.mutateAsync();
      if (result.failedCount || result.acknowledgmentFailedCount) {
        toast.error("L’import est terminé avec des erreurs.", {
          description: `${result.importedCount} importée(s), ${result.failedCount} échouée(s), ${result.acknowledgmentFailedCount} accusé(s) en attente.`,
        });
      } else if (result.importedCount === 0) {
        toast.success("Aucune nouvelle commande web à importer.");
      } else {
        toast.success(
          `${result.importedCount} commande(s) web importée(s) avec succès.`,
        );
      }
      return result;
    } catch (error) {
      const response = error as {
        response?: { data?: { detail?: string } };
      };
      toast.error("Impossible de récupérer les commandes web.", {
        description: response.response?.data?.detail,
      });
      return null;
    }
  }

  return {
    orders: orders.data ?? [],
    isLoading: orders.isPending,
    isError: orders.isError,
    isImporting: importer.isPending,
    isCreating: creator.isPending,
    createAdminOrder,
    retrieveWebOrders,
  };
}
