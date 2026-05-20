import { useQuery } from "@tanstack/react-query";
import { getTasks } from "../api/taskApi";

const TASKS_QUERY_KEY = ["executor-tasks"];

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
