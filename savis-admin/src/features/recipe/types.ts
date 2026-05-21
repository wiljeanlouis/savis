export interface RecipeIngredient {
  ingredientName: string;
  quantity: number;
  unit: string;
  selectedIngredientId?: string;
}

export type ActivityType =
  | "PREP"
  | "COOK"
  | "ASSEMBLY"
  | "PACKAGING"
  | "INSTALLATION"
  | "DELIVERY"
  | "CLEANUP"
  | "CUSTOM";

export interface RecipeActivity {
  id?: number | null;
  type: ActivityType;
  minutes: number;
  sequence: number;
}

export interface RecipeYield {
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string | null;
  name: string;
  description: string;
  imageUrl: string;
  instructions: string;
  ingredients: RecipeIngredient[];
  activities: RecipeActivity[];
  yield: RecipeYield;
}
