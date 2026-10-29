import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listResources,
  saveResource,
  setResourceStatus,
} from "../api/resourceApi";
export function useResources(search: string, page: number) {
  const client = useQueryClient();
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["resources"] });
  };
  return {
    list: useQuery({
      queryKey: ["resources", { search, page }],
      queryFn: () => listResources(search, page),
    }),
    save: useMutation({ mutationFn: saveResource, onSuccess: refresh }),
    changeStatus: useMutation({
      mutationFn: setResourceStatus,
      onSuccess: refresh,
    }),
  };
}
