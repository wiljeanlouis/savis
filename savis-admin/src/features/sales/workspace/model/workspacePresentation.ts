import {
  File01Icon,
  InboxDownloadIcon,
  Invoice03Icon,
  ShoppingCart02Icon,
} from "@hugeicons/core-free-icons";
import type {
  SalesWorkspaceBranch,
  SalesWorkspaceFilter,
} from "../api/workspaceApi";

export const salesWorkspaceDefaultPageSize = 10;
export const salesWorkspacePageSizeOptions = [10, 20, 50] as const;

export const salesWorkspaceFilterOptions: {
  value: SalesWorkspaceFilter;
  label: string;
}[] = [
  { value: "ACTION_REQUIRED", label: "À traiter" },
  { value: "FINISHED", label: "Terminés" },
  { value: "ALL", label: "Tous" },
];

export const workspaceDocumentLabels: Record<
  SalesWorkspaceBranch["type"],
  string
> = {
  REQUEST: "Demande",
  QUOTATION: "Soumission",
  ORDER: "Commande",
  INVOICE: "Facture",
};

export const workspaceDocumentIcons: Record<
  SalesWorkspaceBranch["type"],
  typeof File01Icon
> = {
  REQUEST: InboxDownloadIcon,
  QUOTATION: File01Icon,
  ORDER: ShoppingCart02Icon,
  INVOICE: Invoice03Icon,
};
