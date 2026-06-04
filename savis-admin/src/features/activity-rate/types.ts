export type ActivityType =
  | "PREP"
  | "COOK"
  | "ASSEMBLY"
  | "PACKAGING"
  | "INSTALLATION"
  | "DELIVERY"
  | "CLEANUP"
  | "CUSTOM";

export interface Money {
  amount: number;
  currency: string;
}

export interface ActivityRate {
  id?: number | null;
  activityType: ActivityType;
  hourlyRate: Money;
}

export interface ActivityRateValues {
  activityType: ActivityType;
  hourlyRateAmount: number;
  currency: string;
}

export const activityTypes: { value: ActivityType; label: string }[] = [
  { value: "PREP", label: "Préparation" },
  { value: "COOK", label: "Cuisson" },
  { value: "ASSEMBLY", label: "Assemblage" },
  { value: "PACKAGING", label: "Emballage" },
  { value: "INSTALLATION", label: "Installation" },
  { value: "DELIVERY", label: "Livraison" },
  { value: "CLEANUP", label: "Nettoyage" },
  { value: "CUSTOM", label: "Autre" },
];

export const activityTypeLabel = (activityType: ActivityType) =>
  activityTypes.find((type) => type.value === activityType)?.label ??
  activityType;
