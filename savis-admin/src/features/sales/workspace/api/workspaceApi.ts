import { api } from "@/shared/api";

export type SalesWorkspaceSummary = {
  id: string;
  customerName: string;
  reference: string;
  description: string | null;
  lastActivity: string | null;
  situation: string;
  documentCount: number;
};

export type SalesWorkspaceFilter = "ALL" | "ACTION_REQUIRED" | "FINISHED";

export type SalesWorkspacePage = {
  content: SalesWorkspaceSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type SalesWorkspaceBranch = {
  type: "REQUEST" | "QUOTATION" | "ORDER" | "INVOICE" | "PAYMENT";
  id: string;
  reference: string;
  status: string;
  paymentStatus: string | null;
  paidAt: string | null;
  amountCents: number | null;
  lastActivity: string | null;
  action: string | null;
  actionUrl: string | null;
  warnings: string[];
  children: SalesWorkspaceBranch[];
};

export type SalesWorkspaceDossier = {
  id: string;
  customerName: string;
  reference: string;
  description: string | null;
  lastActivity: string | null;
  situation: string;
  root: SalesWorkspaceBranch;
};

export const listSalesWorkspace = async (params: {
  page: number;
  size: number;
  search: string;
  filter?: SalesWorkspaceFilter;
}) =>
  (
    await api.get<SalesWorkspacePage>("/sales/workspace", {
      params,
    })
  ).data;

export const getSalesWorkspaceDossier = async (dossierId: string) =>
  (
    await api.get<SalesWorkspaceDossier>(
      `/sales/workspace/${encodeURIComponent(dossierId)}`,
    )
  ).data;
