import { api } from "@/shared/api";
import type { MaterialResource, ResourcePage, ResourceValues } from "../types";
export const listResources = async (
  search: string,
  page: number,
): Promise<ResourcePage> =>
  (await api.get("/resources", { params: { search, page, size: 20 } })).data;
export const saveResource = async ({
  id,
  values,
}: {
  id?: string;
  values: ResourceValues;
}): Promise<MaterialResource> =>
  (id
    ? await api.put(`/resources/${id}`, values)
    : await api.post("/resources", values)
  ).data;
export const setResourceStatus = async ({
  id,
  status,
}: Pick<MaterialResource, "id" | "status">): Promise<MaterialResource> =>
  (await api.patch(`/resources/${id}/status`, { status })).data;
