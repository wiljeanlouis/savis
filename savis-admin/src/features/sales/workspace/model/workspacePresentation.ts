import {
  File01Icon,
  InboxDownloadIcon,
  Invoice03Icon,
  Money01Icon,
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
  { value: "ALL", label: "Tous" },
  { value: "ACTION_REQUIRED", label: "À traiter" },
  { value: "FINISHED", label: "Terminés" },
];

export const workspaceDocumentLabels: Record<
  SalesWorkspaceBranch["type"],
  string
> = {
  REQUEST: "Demande",
  QUOTATION: "Soumission",
  ORDER: "Commande",
  INVOICE: "Facture",
  PAYMENT: "Paiement",
};

export const workspaceDocumentIcons: Record<
  SalesWorkspaceBranch["type"],
  typeof File01Icon
> = {
  REQUEST: InboxDownloadIcon,
  QUOTATION: File01Icon,
  ORDER: ShoppingCart02Icon,
  INVOICE: Invoice03Icon,
  PAYMENT: Money01Icon,
};

export const workspacePaymentStatusLabels: Record<string, string> = {
  UNPAID: "Non payée",
  PAID: "Payée",
};

export const workspaceStatusLabels: Record<
  SalesWorkspaceBranch["type"],
  Record<string, string>
> = {
  REQUEST: {
    RECEIVED: "Reçue",
    IN_PROGRESS: "En préparation",
    QUOTED: "Soumise",
    CLOSED: "Clôturée",
  },
  QUOTATION: {
    DRAFT: "Brouillon",
    SENT: "Envoyée",
    ACCEPTED: "Acceptée",
    REJECTED: "Refusée",
  },
  ORDER: {
    NEW: "Nouvelle",
    ACCEPTED: "Confirmée",
    IN_PREPARATION: "En préparation",
    READY: "Prête",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
    REJECTED: "Refusée",
  },
  INVOICE: {
    DRAFT: "Brouillon",
    ISSUED: "Émise",
    CANCELLED: "Annulée",
  },
  PAYMENT: {
    PAID: "Payée",
    UNPAID: "Non payée",
  },
};
