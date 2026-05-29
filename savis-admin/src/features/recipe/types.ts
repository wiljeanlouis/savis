export interface RecipeIngredient {
  ingredientName: string;
  quantity: number;
  unit: string;
  selectedOfferId?: string | null;
}

export interface RecipeOffer {
  id: string;
  url: string | null;
  componentName: string;
  brand: string | null;
  label: string | null;
  imageUrl: string | null;
  price: {
    amount: number;
    currency: string;
  } | null;
  packageSize: {
    value: number;
    unit: string;
  } | null;
  provider: {
    name: string;
    identifier: string;
    site: string | null;
  } | null;
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

export interface RecipePrice {
  amount: number;
  currency: string;
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
  price?: RecipePrice | null;
}
