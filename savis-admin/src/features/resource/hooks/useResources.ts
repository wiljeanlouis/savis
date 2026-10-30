import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listResources,
  saveResource,
  setResourceStatus,
} from "../api/resourceApi";
import type { ResourcePage, ResourceCategory, ResourceSort } from "../types";

export function useResources(
  search: string,
  page: number,
  status?: "ACTIVE" | "INACTIVE",
  pageSize = 20,
  category?: ResourceCategory,
  sort: ResourceSort = "name,asc",
) {
  const client = useQueryClient();
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["resources"] });
  };
  return {
    list: useQuery({
      queryKey: [
        "resources",
        { search, page, status, pageSize, category, sort },
      ],
      queryFn: () =>
        listResources(search, page, status, pageSize, category, sort),
    }),
    save: useMutation({ mutationFn: saveResource, onSuccess: refresh }),
    changeStatus: useMutation({
      mutationFn: setResourceStatus,
      onMutate: async ({ id, status }) => {
        await client.cancelQueries({ queryKey: ["resources"] });
        const previous = client.getQueriesData<ResourcePage>({
          queryKey: ["resources"],
        });
        client.setQueriesData<ResourcePage>(
          { queryKey: ["resources"] },
          (page) =>
            page && {
              ...page,
              content: page.content.map((resource) =>
                resource.id === id ? { ...resource, status } : resource,
              ),
            },
        );
        return { previous };
      },
      onError: (_error, _variables, context) => {
        context?.previous.forEach(([queryKey, page]) => {
          client.setQueryData(queryKey, page);
        });
      },
      onSettled: refresh,
    }),
  };
}
