import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import type { MaterialResource } from "../types";
import type { BomOffer } from "@/features/bom/types";

export function ResourceOffersDialog({
  resource,
  onClose,
}: {
  resource: MaterialResource;
  onClose: () => void;
}) {
  const offers = useQuery({
    queryKey: ["resource-offers", resource.id],
    queryFn: async () =>
      (
        await api.get<
          Array<BomOffer & { status: "AVAILABLE" | "UNAVAILABLE" }>
        >(`/supply/offers/resource/${resource.id}`)
      ).data,
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Offres : {resource.name}</DialogTitle>
          <DialogDescription>
            Offres fournisseurs associées à cette ressource, y compris les
            offres indisponibles.
          </DialogDescription>
        </DialogHeader>
        {offers.isPending && <p>Chargement…</p>}
        {offers.isError && (
          <ApiErrorAlert
            title="Impossible de charger les offres."
            error={offers.error}
          />
        )}
        {offers.data?.length === 0 && <p>Aucune offre associée.</p>}
        <ul className="max-h-80 space-y-3 overflow-auto">
          {offers.data?.map((offer) => (
            <li key={offer.id}>
              {offer.provider?.name} · {offer.label ?? offer.componentName} ·{" "}
              {offer.packageSize?.value} {offer.packageSize?.unit} ·{" "}
              {offer.price?.amount} {offer.price?.currency} ·{" "}
              {offer.status === "AVAILABLE" ? "Disponible" : "Indisponible"}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
