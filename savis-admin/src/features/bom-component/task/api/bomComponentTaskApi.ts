import { executorApi } from "@/shared/api";
import type {
  CreateSavisTaskPayload,
  SavisTask,
  SavisTaskStatus,
  SavisTaskType,
  SavisTasksPage,
} from "../types";

interface GetTasksParams {
  page: number;
  size: number;
  status?: SavisTaskStatus;
  type?: SavisTaskType;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export const getBomComponentTasks = async ({
  page,
  size,
  status,
  type,
  sortBy,
  sortDirection,
}: GetTasksParams): Promise<SavisTasksPage> => {
  const { data }: { data: SavisTasksPage } = await executorApi.get("/tasks", {
    params: {
      status,
      type,
      page,
      size,
      sort_by: sortBy,
      sort_direction: sortDirection,
    },
  });
  return data;
};

export const createBomComponentTask = async (
  payload: CreateSavisTaskPayload,
): Promise<SavisTask> => {
  const { data }: { data: SavisTask } = await executorApi.post(
    "/tasks",
    payload,
  );
  return data;
};
