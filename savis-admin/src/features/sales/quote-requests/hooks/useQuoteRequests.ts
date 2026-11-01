import { listProposals, createProposal } from "../api/quoteRequestApi";
import { saveQualification, saveRequestStatus } from "../api/quoteRequestApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRequest,
  importRequests,
  listRequests,
} from "../api/quoteRequestApi";
export const requestKeys = {
  all: ["quote-requests"] as const,
  detail: (id: string) => ["quote-requests", id] as const,
};
export function useRequests(params: Parameters<typeof listRequests>[0]) {
  return useQuery({
    queryKey: [...requestKeys.all, params],
    queryFn: () => listRequests(params),
  });
}
export function useRequest(id: string) {
  return useQuery({
    queryKey: requestKeys.detail(id),
    queryFn: () => getRequest(id),
    refetchOnWindowFocus: false,
    enabled: !!id,
  });
}
export function useImportRequests() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: importRequests,
    onSuccess: () => client.invalidateQueries({ queryKey: requestKeys.all }),
  });
}

export function useSaveQualification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveQualification,
    onSuccess: () => client.invalidateQueries({ queryKey: requestKeys.all }),
  });
}
export function useSaveRequestStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveRequestStatus,
    onSuccess: () => client.invalidateQueries({ queryKey: requestKeys.all }),
  });
}

export function useProposals(id: string) {
  return useQuery({
    queryKey: [...requestKeys.detail(id), "quotations"],
    queryFn: () => listProposals(id),
  });
}
export function useCreateProposal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createProposal,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: requestKeys.all }),
        client.invalidateQueries({ queryKey: ["quotations"] }),
      ]);
    },
  });
}
