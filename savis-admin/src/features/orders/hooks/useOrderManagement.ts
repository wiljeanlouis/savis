import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/api/apiError";
import { useImportOrders, useOrders } from "./useOrderApi";

export function useOrderManagement() {
  const orders = useOrders();
  const importer = useImportOrders();

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
      toast.error("Impossible de récupérer les commandes web.", {
        description: getApiErrorMessage(error),
      });
      return null;
    }
  }

  return {
    orders: orders.data ?? [],
    isLoading: orders.isPending,
    isError: orders.isError,
    error: orders.error,
    isImporting: importer.isPending,
    retrieveWebOrders,
  };
}
