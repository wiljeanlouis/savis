import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBomComponentTask,
  getBomComponentTasks,
} from "../api/bomComponentTaskApi";
import type { CreateSavisTaskPayload } from "../types";

export const BOM_COMPONENT_TASKS_QUERY_KEY = ["executor-tasks"];

export const useGetBomComponentTasks = (
  page: number,
  size: number,
  sortBy?: string,
  sortDirection?: "asc" | "desc",
) => {
  return useQuery({
    queryKey: [
      ...BOM_COMPONENT_TASKS_QUERY_KEY,
      page,
      size,
      sortBy,
      sortDirection,
    ],
    queryFn: () => getBomComponentTasks({ page, size, sortBy, sortDirection }),
  });
};

export const useCreateBomComponentTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSavisTaskPayload) =>
      createBomComponentTask(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: BOM_COMPONENT_TASKS_QUERY_KEY,
      });
    },
  });
};
