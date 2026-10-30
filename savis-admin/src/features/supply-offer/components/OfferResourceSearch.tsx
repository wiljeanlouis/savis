import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listResources } from "@/features/resource/api/resourceApi";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";

export function OfferResourceSearch({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [search, setSearch] = useState("");
  const results = useQuery({
    queryKey: ["resources", "active", search.trim()],
    queryFn: () => listResources(search.trim(), 0, "ACTIVE"),
    enabled: search.trim().length >= 2,
  });
  return (
    <div className="space-y-2">
      <Input
        aria-label="Rechercher une ressource existante"
        placeholder="Rechercher une ressource (2 caractères minimum)"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onSelect(null);
        }}
      />
      {results.isError && (
        <ApiErrorAlert title="Recherche impossible." error={results.error} />
      )}
      {search.trim().length >= 2 && (
        <div className="max-h-40 overflow-auto">
          {results.data?.content.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={selectedId === item.id ? "default" : "outline"}
              className="m-1"
              onClick={() => onSelect(item.id)}
            >
              {item.name} · {item.referenceUnit ?? "Sans unité"}
            </Button>
          ))}
          {results.data?.content.length === 0 && (
            <p>Aucune ressource trouvée.</p>
          )}
        </div>
      )}
    </div>
  );
}
