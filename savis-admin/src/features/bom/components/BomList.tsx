import { BomCard } from "./BomCard";
import { useBomList } from "../hooks/useBomList";
import { Spinner } from "@/shared/ui/spinner";
import { toast } from "sonner";
import { NoData } from "@/shared/components/NoData";
import { Button } from "@/shared/ui/button";
import { Link } from "react-router";
import { BomSearch } from "./BomSearch";
import { useMemo, useState } from "react";

const normalizeSearchValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export const BomList = () => {
  const { boms, isLoading, isError, error, deleteBom } = useBomList();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBoms = useMemo(() => {
    const normalizedSearchQuery = normalizeSearchValue(searchQuery.trim());

    if (!boms || !normalizedSearchQuery) {
      return boms;
    }

    return boms.filter((bom) => {
      const searchableContent = [
        bom.name,
        bom.description,
        bom.instructions,
        ...bom.components.map((component) => component.componentName),
      ].join(" ");

      return normalizeSearchValue(searchableContent).includes(
        normalizedSearchQuery,
      );
    });
  }, [boms, searchQuery]);

  if (isError) {
    const errorResponse = error as unknown as {
      response: { data?: { detail?: string } };
    };
    toast.error(
      "Une erreur est survenue lors de la récupération de la liste de BOM.",
      {
        description: errorResponse.response?.data?.detail,
      },
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">BOM</h1>
          <p className="text-sm text-muted-foreground">
            Tout ce qui rentre dans la fabrication d'un élément vendable. Il
            peut être une recette, un matériel, etc
          </p>
        </div>

        <div className="flex flex-row gap-3">
          <BomSearch
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
          <Button>
            <Link to="/boms/add">+ Ajouter</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {!boms ||
          boms.length === 0 ||
          !filteredBoms ||
          filteredBoms.length === 0 ? (
            <NoData />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBoms.map((bom) => (
                <BomCard
                  key={bom.id}
                  bom={bom}
                  deleteBom={() => {
                    void (bom.id && deleteBom(bom.id));
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};
