import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { DetailSheet } from "@/shared/components/DetailSheet";
import type { RefObject } from "react";
import type { MaterialResource } from "../types";
import type { BomOffer } from "@/features/bom/types";

export function ResourceOffersDrawer({
  resource,
  onClose,
  listRef,
}: {
  resource: MaterialResource;
  onClose: () => void;
  listRef: RefObject<HTMLDivElement | null>;
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
    <DetailSheet
      open
      onClose={onClose}
      title={`Offres : ${resource.name}`}
      listRef={listRef}
    >
      <section
        aria-label="Offres fournisseurs"
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card"
      >
        <header className="shrink-0 space-y-1.5 border-b px-5 py-4">
          <h2 className="text-xl leading-snug font-semibold tracking-tight [overflow-wrap:anywhere]">
            Offres : {resource.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Offres fournisseurs associées à cette ressource, y compris les
            offres indisponibles.
          </p>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-5">
          {offers.isPending && <p role="status">Chargement…</p>}
          {offers.isError && (
            <ApiErrorAlert
              title="Impossible de charger les offres."
              error={offers.error}
            />
          )}
          {offers.data?.length === 0 && <p>Aucune offre associée.</p>}
          <ul className="space-y-3">
            {offers.data?.map((offer) => (
              <li key={offer.id} className="rounded-lg border p-3">
                {offer.provider?.name} · {offer.label ?? offer.componentName} ·{" "}
                {offer.packageSize?.value} {offer.packageSize?.unit} ·{" "}
                {offer.price?.amount} {offer.price?.currency} ·{" "}
                {offer.status === "AVAILABLE" ? "Disponible" : "Indisponible"}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </DetailSheet>
  );
}
