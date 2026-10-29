import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listResources,
  saveResource,
  setResourceStatus,
} from "../api/resourceApi";
export function useResources(
  search: string,
  page: number,
  status?: "ACTIVE" | "INACTIVE",
  pageSize = 20,
) {
  const client = useQueryClient();
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["resources"] });
  };
  return {
    list: useQuery({
      queryKey: ["resources", { search, page, status, pageSize }],
      queryFn: () => listResources(search, page, status, pageSize),
    }),
    save: useMutation({ mutationFn: saveResource, onSuccess: refresh }),
    changeStatus: useMutation({
      mutationFn: setResourceStatus,
      onSuccess: refresh,
    }),
  };
}
