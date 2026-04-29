import { RecipeCard } from "./RecipeCard";
import { useRecipeList } from "../hooks/useRecipeList";
import { Spinner } from "@/shared/ui/spinner";
import { toast } from "sonner";
import { NoData } from "@/shared/components/NoData";

export const RecipeList = () => {
  const { recipes, isLoading, isError, error, deleteRecipe } = useRecipeList();

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {!recipes || recipes.length === 0 ? (
        <NoData />
      ) : (
        recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            deleteRecipe={() => {
              void (recipe.id && deleteRecipe(recipe.id));
            }}
          />
        ))
      )}
    </div>
  );
};
