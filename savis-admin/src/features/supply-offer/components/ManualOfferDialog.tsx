import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { OfferResourceSearch } from "./OfferResourceSearch";

export function ManualOfferDialog({ onClose }: { onClose: () => void }) {
  const client = useQueryClient();
  const [resourceId, setResourceId] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async (form: FormData) =>
      api.post("/supply/offers", {
        resourceId,
        ...Object.fromEntries(form),
        price: form.get("price"),
        packageValue: Number(form.get("packageValue")),
      }),
    onSuccess: async () => {
      await Promise.all(
        [
          "supply-offers",
          "available-offers",
          "resource-offers",
          "boms",
          "catalog-products",
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
      onClose();
    },
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle offre fournisseur</DialogTitle>
          <DialogDescription>
            Sélectionnez une ressource existante puis renseignez le produit
            fournisseur et son prix.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(new FormData(e.currentTarget));
          }}
        >
          <OfferResourceSearch
            selectedId={resourceId}
            onSelect={setResourceId}
          />
          {[
            ["providerName", "Fournisseur"],
            ["providerIdentifier", "Code fournisseur"],
            ["externalId", "Référence fournisseur"],
            ["label", "Libellé du produit"],
          ].map(([name, label]) => (
            <label className="block space-y-1" key={name}>
              {label}
              <Input name={name} required maxLength={255} />
            </label>
          ))}
          <label className="block">
            Marque
            <Input name="brand" maxLength={255} />
          </label>
          <label className="block">
            URL du produit
            <Input name="url" type="url" maxLength={255} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              Prix du paquet
              <Input name="price" type="number" required min="0" step="0.01" />
            </label>
            <label>
              Devise
              <Input
                name="currency"
                required
                defaultValue="CAD"
                maxLength={3}
                minLength={3}
              />
            </label>
            <label>
              Quantité du paquet
              <Input
                name="packageValue"
                type="number"
                required
                min="0.000001"
                step="any"
              />
            </label>
            <label>
              Unité
              <select
                name="packageUnit"
                className="h-9 w-full rounded-md border px-3"
                defaultValue="g"
              >
                {["g", "kg", "ml", "l", "piece"].map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </label>
          </div>
          {save.isError && (
            <ApiErrorAlert title="Création impossible." error={save.error} />
          )}
          <Button type="submit" disabled={!resourceId || save.isPending}>
            Créer l’offre
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
