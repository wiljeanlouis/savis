import { api } from "@/shared/api";
import type {
  QuoteRequest,
  QuoteRequestPage,
  ImportResult,
} from "../model/types";
export const listRequests = async (params: {
  page: number;
  search: string;
  sort: string;
  status?: string;
}) =>
  (
    await api.get<QuoteRequestPage>("/quote-requests", {
      params: { ...params, size: 20 },
    })
  ).data;
export const getRequest = async (id: string) =>
  (await api.get<QuoteRequest>(`/quote-requests/${id}`)).data;
export const importRequests = async () =>
  (await api.post<ImportResult>("/quote-requests/import")).data;

export const saveQualification = async ({
  id,
  expectedVersion,
  qualification,
}: {
  id: string;
  expectedVersion: number;
  qualification: import("../model/types").Qualification;
}) =>
  (
    await api.put<QuoteRequest>(`/quote-requests/${id}/qualification`, {
      expectedVersion,
      qualification,
    })
  ).data;
export const saveRequestStatus = async ({
  id,
  expectedVersion,
  status,
  reason,
}: {
  id: string;
  expectedVersion: number;
  status: import("../model/types").RequestStatus;
  reason?: string;
}) =>
  (
    await api.put<QuoteRequest>(`/quote-requests/${id}/status`, {
      expectedVersion,
      status,
      reason,
    })
  ).data;

export interface ProposalCommand {
  proposalRequestId: string;
  expectedVersion: number;
  lineIds: string[];
  exclusions: Record<string, string>;
  validUntil: string;
  note: string | null;
  discountCents: number;
  deliveryFeeCents: number;
}
export const listProposals = async (id: string) =>
  (
    await api.get<import("../../quotations/types").Quotation[]>(
      `/quote-requests/${id}/quotations`,
    )
  ).data;
export const createProposal = async ({
  id,
  command,
}: {
  id: string;
  command: ProposalCommand;
}) =>
  (
    await api.post<import("../../quotations/types").Quotation>(
      `/quote-requests/${id}/quotations`,
      command,
    )
  ).data;
