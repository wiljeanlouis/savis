export interface RecipeIngredient {
  ingredientId: string
  quantity: number
  unit: string
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  ingredients: RecipeIngredient[];
  instructions: string;
}