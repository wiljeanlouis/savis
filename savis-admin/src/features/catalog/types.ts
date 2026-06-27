export type ProductType =
  | "STANDARD"
  | "SINGLE_CHOICE"
  | "SINGLE_CHOICE_BUNDLE"
  | "INGREDIENT_CUSTOMIZATION";

export type AllocationType = "NONE" | "SINGLE_CHOICE" | "CHOICE_ALLOCATION";
export type PriceHealthStatus = "GOOD" | "REVIEW" | "LOSS" | "INCOMPLETE";
export type ProductCategory = "TASTING" | "DECORATION";

export const productCategories: { value: ProductCategory; label: string }[] = [
  { value: "TASTING", label: "Dégustation" },
  { value: "DECORATION", label: "Décoration" },
];

export interface Money {
  amount: number;
  currency: string;
}

export interface ProductPurchaseMode {
  id: string | null;
  code: string;
  label: string;
  quantity: number;
  price: Money;
  allocationType: AllocationType;
  active: boolean;
  displayOrder: number;
}

export interface ProductBom {
  id: string | null;
  bomId: string;
  quantity: number;
  displayOrder: number;
}

export interface ProductChoiceOption {
  id: string | null;
  code: string;
  name: string;
  bomId: string | null;
  active: boolean;
  displayOrder: number;
}

export interface ProductChoiceGroup {
  id: string | null;
  label: string;
  required: boolean;
  options: ProductChoiceOption[];
}

export interface ProductIngredientOption {
  id: string | null;
  code: string;
  name: string;
  bomId: string | null;
  defaultQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  extraPrice: Money;
  active: boolean;
  displayOrder: number;
}

export interface CatalogProduct {
  id: string | null;
  code: string;
  slug: string;
  name: string;
  description: string;
  productType: ProductType;
  category: ProductCategory;
  productBoms: ProductBom[];
  targetMarginRate: number;
  imageUrl: string;
  gallery: string[];
  availabilityNote: string;
  available: boolean;
  published: boolean;
  displayOrder: number;
  purchaseModes: ProductPurchaseMode[];
  choiceGroup: ProductChoiceGroup | null;
  ingredientOptions: ProductIngredientOption[];
}

export interface ProductConfiguration {
  purchaseModeCode: string | null;
  choiceCode: string | null;
  allocations: { choiceCode: string; quantity: number }[];
  ingredients: { ingredientCode: string; quantity: number }[];
}

export interface ProductPricingAnalysis {
  analysisType: "CONFIGURATION" | "WORST_CASE";
  analyzedQuantity: number;
  salePrice: Money;
  unitCost: Money;
  cost: Money;
  actualMarginRate: number | null;
  targetMarginRate: number;
  recommendedPrice: Money | null;
  status: PriceHealthStatus;
  complete: boolean;
  missingBomIds: string[];
}

const cad = (amount = 0): Money => ({ amount, currency: "CAD" });

export const emptyCatalogProduct = (
  category: ProductCategory = "TASTING",
): CatalogProduct => ({
  id: null,
  code: "",
  slug: "",
  name: "",
  description: "",
  productType: "STANDARD",
  category,
  productBoms: [],
  targetMarginRate: 0.3,
  imageUrl: "",
  gallery: [],
  availabilityNote: "Disponible sur commande",
  available: true,
  published: false,
  displayOrder: 0,
  purchaseModes: [emptyPurchaseMode()],
  choiceGroup: null,
  ingredientOptions: [],
});

export const emptyProductBom = (displayOrder = 0, bomId = ""): ProductBom => ({
  id: null,
  bomId,
  quantity: 1,
  displayOrder,
});

export const emptyPurchaseMode = (): ProductPurchaseMode => ({
  id: null,
  code: "",
  label: "",
  quantity: 1,
  price: cad(),
  allocationType: "NONE",
  active: true,
  displayOrder: 0,
});

export const emptyChoiceOption = (): ProductChoiceOption => ({
  id: null,
  code: "",
  name: "",
  bomId: null,
  active: true,
  displayOrder: 0,
});

export const emptyIngredientOption = (): ProductIngredientOption => ({
  id: null,
  code: "",
  name: "",
  bomId: null,
  defaultQuantity: 1,
  minQuantity: 0,
  maxQuantity: 3,
  extraPrice: cad(),
  active: true,
  displayOrder: 0,
});
