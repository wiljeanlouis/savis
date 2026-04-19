import { RecipeCard } from "../components/RecipeCard";
import type { Recipe } from "../types";
import recipeList from "../api/recipe-list.json";
import { RecipeListHeader } from "../components/RecipeListHeader";

export const RecipeList = () => {


  const recipes: Recipe[] = recipeList.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    image: recipe.image,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
  }));

  return (
    <div className="flex-1 p-6 space-y-4">
      <RecipeListHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} {...recipe} />
        ))}
      </div>
    </div>
  );
}