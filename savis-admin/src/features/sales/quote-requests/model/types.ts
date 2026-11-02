export type RequestStatus = "RECEIVED" | "IN_PROGRESS" | "QUOTED" | "CLOSED";
export interface QualifiedLine {
  id: string;
  productId: string;
  quantity: number;
  purchaseModeCode: string | null;
  choiceCode: string | null;
  allocations: { choiceCode: string; quantity: number }[];
  ingredients: { ingredientCode: string; quantity: number }[];
  needKeys: string[];
}
export interface Qualification {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  internalNotes: string | null;
  lines: QualifiedLine[];
  exclusions: Record<string, string>;
}
export interface QuoteRequest {
  preparation?: {
    qualification: Qualification;
    saved: boolean;
    needs: PreparedNeed[];
  } | null;
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
  QUOTED: "Soumission créée",
  CLOSED: "Clôturée",
};

export interface PreparedNeed {
  needKey: string;
  requestedName: string | null;
  productName: string | null;
  state: "RECOGNIZED" | "REVIEW" | "UNRESOLVED" | "CUSTOM";
  issue: string | null;
  requestedLine: QualifiedLine | null;
}

export function effectiveQualification(request: QuoteRequest) {
  return request.qualification ?? request.preparation?.qualification;
}
