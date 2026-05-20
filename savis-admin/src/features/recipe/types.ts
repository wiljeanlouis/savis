export interface RecipeIngredient {
  ingredientName: string;
  quantity: number;
  unit: string;
  selectedIngredientId?: string;
}

export interface Recipe {
  id: string | null;
  name: string;
  description: string;
  imageUrl: string;
  instructions: string;
  ingredients: RecipeIngredient[];
  cookingMinutes: number;
  preparationMinutes: number;
}
