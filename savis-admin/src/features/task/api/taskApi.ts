import { executorApi } from "@/shared/api";
import type {
  CreateSavisTaskPayload,
  SavisTask,
  SavisTasksPage,
} from "../types";

interface GetTasksParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export const getTasks = async ({
  page,
  size,
  sortBy,
  sortDirection,
}: GetTasksParams): Promise<SavisTasksPage> => {
  const { data }: { data: SavisTasksPage } = await executorApi.get("/tasks", {
    params: { page, size, sort_by: sortBy, sort_direction: sortDirection },
  });
  return data;
};

export const createTask = async (
  payload: CreateSavisTaskPayload,
): Promise<SavisTask> => {
  const { data }: { data: SavisTask } = await executorApi.post(
    "/tasks",
    payload,
  );
  return data;
};
