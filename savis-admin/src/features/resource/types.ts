export const resourceCategories = {
  INGREDIENT: "Ingrédient",
  CONSUMABLE: "Consommable",
  PACKAGING: "Emballage",
  EQUIPMENT: "Équipement",
  DECORATION_MATERIAL: "Matériel de décoration",
} as const;
export type ResourceCategory = keyof typeof resourceCategories;
export interface MaterialResource {
  id: string;
  name: string;
  description: string | null;
  category: ResourceCategory;
  referenceUnit: string | null;
  status: "ACTIVE" | "INACTIVE";
}
export type ResourceValues = Pick<
  MaterialResource,
  "name" | "description" | "category" | "referenceUnit"
>;
export interface ResourcePage {
  content: MaterialResource[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
}

export type ResourceSort =
  `${"name" | "category" | "referenceUnit"},${"asc" | "desc"}`;
