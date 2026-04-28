import { RecipeCard } from "./RecipeCard";
import { useRecipeList } from "../hooks/useRecipeList";
import { Spinner } from "@/shared/ui/spinner";

export const RecipeList = () => {
  const { recipes, isLoading, deleteRecipe } = useRecipeList();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (recipes.length === 0) {
    return <div>No recipes found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          deleteRecipe={() => {
            void (recipe.id && deleteRecipe(recipe.id));
          }}
        />
      ))}
    </div>
  );
};
