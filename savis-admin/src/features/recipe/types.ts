export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  instructions: string;
  ingredients: RecipeIngredient[];
  cookingMinutes: number;
  preparationMinutes: number;
}
