import { NoData } from "@/shared/components/NoData";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useGetOffers, usePatchOffer } from "../hooks/useOfferApi";
import type { Offer, OfferStatus } from "../types";
import { OfferCard } from "./OfferCard";
import type { OfferEditValues } from "./OfferEditDialog";

const sortOptions = [
  { value: "last_retrieved_at", label: "Dernier obtenu" },
  { value: "label", label: "Produit" },
  { value: "brand", label: "Marque" },
  { value: "price", label: "Prix" },
  { value: "package_size", label: "Format" },
  { value: "provider", label: "Provider" },
  { value: "search_term", label: "Recherche" },
  { value: "status", label: "Statut" },
  { value: "next_refresh_at", label: "Prochain refresh" },
];

type SortDirection = "asc" | "desc";

export const OfferList = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("last_retrieved_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const { data, isPending, isError, error } = useGetOffers(
    page,
    pageSize,
    sortBy,
    sortDirection,
  );
  const patchOffer = usePatchOffer();

  const handlePageSizeChange = (size: number) => {
    setPage(1);
    setPageSize(size);
  };

  const handleSortByChange = (value: string) => {
    setPage(1);
    setSortBy(value);
  };

  const toggleSortDirection = () => {
    setPage(1);
    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
  };

  const handleQuickPatch = (offer: Offer, status: OfferStatus) => {
    const action =
      status === "VALID"
        ? "validée"
        : offer.status === "VALID"
          ? "invalidée"
          : "rejetée";

    patchOffer.mutate(
      { id: offer.id, payload: { status } },
      {
        onSuccess: () => toast.success(`Offre ${action}.`),
        onError: () => toast.error("La mise à jour de l'offre a échoué."),
      },
    );
  };

  const handleEdit = (offer: Offer, values: OfferEditValues) => {
    patchOffer.mutate(
      {
        id: offer.id,
        payload: {
          status: values.status,
          refresh_frequency_hours: values.refreshFrequencyHours,
          refresh_now: values.refreshNow,
        },
      },
      {
        onSuccess: () => toast.success("Offre mise à jour."),
        onError: () => toast.error("La mise à jour de l'offre a échoué."),
      },
    );
  };

  if (isError) {
    const errorResponse = error as unknown as {
      response?: { data?: { detail?: string } };
    };
    toast.error("Une erreur est survenue lors de la récupération des offers.", {
      description: errorResponse.response?.data?.detail,
    });
  }

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data?.items.length) {
    return <NoData />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortDirection}
            title={sortDirection === "asc" ? "Ascendant" : "Descendant"}
          >
            <HugeiconsIcon
              icon={sortDirection === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
              strokeWidth={2}
            />
            <span className="sr-only">
              {sortDirection === "asc" ? "Ascendant" : "Descendant"}
            </span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Par page</span>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger size="sm" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {data.items.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            isPatching={patchOffer.isPending}
            onPatch={handleQuickPatch}
            onEdit={handleEdit}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-muted-foreground">
          {data.total_items} offre{data.total_items > 1 ? "s" : ""}
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={data.page <= 1}
          >
            Précédent
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {data.page} sur {Math.max(data.total_pages, 1)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((current) => Math.min(current + 1, data.total_pages))
            }
            disabled={data.page >= data.total_pages}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
};
