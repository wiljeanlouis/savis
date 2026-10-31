import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { getResource } from "@/features/resource/api/resourceApi";
import { Button } from "@/shared/ui/button";
import { OfferResourceSearch } from "./OfferResourceSearch";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import type { SupplyOffer } from "../types";

/** Association is validated in SAVIS, independently of provider review. */
export function OfferResourceEditor({ offer }: { offer: SupplyOffer }) {
  const client = useQueryClient();
  const [resourceId, setResourceId] = useState(offer.resourceId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const resource = useQuery({
    queryKey: ["resources", "by-id", resourceId],
    queryFn: () => getResource(resourceId!),
    enabled: Boolean(resourceId),
  });
  const save = useMutation({
    mutationFn: async () => {
      await api.put(`/supply/offers/${offer.id}/resource`, {
        resourceId: selectedId,
      });
      return selectedId;
    },
    onSuccess: async (id) => {
      setResourceId(id);
      setSelectedId(null);
      await Promise.all(
        [
          "supply-offers",
          "available-offers",
          "boms",
          "catalog-products",
          "resource-offers",
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
    },
  });
  return (
    <section className="space-y-3" aria-label="Association à une ressource">
      <p>Ressource : {resource.data?.name ?? resourceId ?? "À associer"}</p>
      {resource.isError && (
        <ApiErrorAlert
          title="Impossible de charger la ressource."
          error={resource.error}
        />
      )}
      <OfferResourceSearch selectedId={selectedId} onSelect={setSelectedId} />
      <Button
        disabled={!selectedId || save.isPending}
        onClick={() => save.mutate()}
      >
        Associer la ressource
      </Button>
      {save.isSuccess && <p role="status">Association enregistrée.</p>}
      {save.isError && (
        <ApiErrorAlert title="Association impossible." error={save.error} />
      )}
    </section>
  );
}
