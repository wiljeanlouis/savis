import { useQuery } from "@tanstack/react-query";
import { getSalesWorkspaceDossier } from "../api/workspaceApi";

export function useSalesWorkspaceDossier(dossierId: string) {
  return useQuery({
    queryKey: ["sales", "workspace", "dossier", dossierId],
    queryFn: () => getSalesWorkspaceDossier(dossierId),
    enabled: Boolean(dossierId),
  });
}
