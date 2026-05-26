import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTask, getTasks } from "../api/taskApi";
import type { CreateSavisTaskPayload } from "../types";

export const TASKS_QUERY_KEY = ["executor-tasks"];

export const useGetTasks = (
  page: number,
  size: number,
  sortBy?: string,
  sortDirection?: "asc" | "desc",
) => {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, page, size, sortBy, sortDirection],
    queryFn: () => getTasks({ page, size, sortBy, sortDirection }),
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSavisTaskPayload) => createTask(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};
