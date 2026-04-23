export interface RecipeIngredient {
  ingredientName: string;
  quantity: number;
  unit: string;
  selectedOfferId?: string;
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
