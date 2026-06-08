import { RecipeCard } from "./RecipeCard";
import { useRecipeList } from "../hooks/useRecipeList";
import { Spinner } from "@/shared/ui/spinner";
import { toast } from "sonner";
import { NoData } from "@/shared/components/NoData";
import { Button } from "@/shared/ui/button";
import { Link } from "react-router";
import { RecipeSearch } from "./RecipeSearch";
import { useMemo, useState } from "react";

const normalizeSearchValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export const RecipeList = () => {
  const { recipes, isLoading, isError, error, deleteRecipe } = useRecipeList();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipes = useMemo(() => {
    const normalizedSearchQuery = normalizeSearchValue(searchQuery.trim());

    if (!recipes || !normalizedSearchQuery) {
      return recipes;
    }

    return recipes.filter((recipe) => {
      const searchableContent = [
        recipe.name,
        recipe.description,
        recipe.instructions,
        ...recipe.components.map((component) => component.componentName),
      ].join(" ");

      return normalizeSearchValue(searchableContent).includes(
        normalizedSearchQuery,
      );
    });
  }, [recipes, searchQuery]);

  if (isError) {
    const errorResponse = error as unknown as {
      response: { data?: { detail?: string } };
    };
    toast.error(
      "Une erreur est survenue lors de la récupération de la liste de recettes.",
      {
        description: errorResponse.response?.data?.detail,
      },
    );
  }

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Recettes</h1>

        <div className="flex flex-row gap-3">
          <RecipeSearch
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
          <Button>
            <Link to="/recipes/add">+ Ajouter</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {!recipes ||
          recipes.length === 0 ||
          !filteredRecipes ||
          filteredRecipes.length === 0 ? (
            <NoData />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  deleteRecipe={() => {
                    void (recipe.id && deleteRecipe(recipe.id));
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
