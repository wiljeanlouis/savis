export type RequestStatus = "RECEIVED" | "IN_PROGRESS" | "QUOTED" | "CLOSED";
export interface QualifiedLine {
  id: string;
  productId: string;
  quantity: number;
  purchaseModeCode: string;
  choiceCode: string;
  allocations: { choiceCode: string; quantity: number }[];
  ingredients: { ingredientCode: string; quantity: number }[];
  needKeys: string[];
}
export interface Qualification {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  internalNotes: string;
  lines: QualifiedLine[];
  exclusions: Record<string, string>;
}
export interface QuoteRequest {
  status: RequestStatus;
  version: number;
  qualification: Qualification | null;
  closedReason: string | null;
  needKeys: string[];
  publicId: string;
  source: string;
  externalId: string;
  submissionRequestId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  originalPayload: string;
  receivedAt: string;
  importedAt: string;
}
export interface QuoteRequestPage {
  content: QuoteRequest[];
  totalElements: number;
  page: number;
  size: number;
}
export interface ImportResult {
  fetched: number;
  imported: number;
  alreadyImported: number;
  failed: number;
  acknowledgmentFailed: number;
  failures: { externalId: string | null; code: string; reason?: string }[];
}

export const requestStatusLabels: Record<RequestStatus, string> = {
  RECEIVED: "Reçue",
  IN_PROGRESS: "En cours",
  QUOTED: "Devis créé",
  CLOSED: "Clôturée",
};
