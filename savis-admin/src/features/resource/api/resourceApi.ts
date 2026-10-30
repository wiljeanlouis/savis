import { api } from "@/shared/api";
import type {
  MaterialResource,
  ResourcePage,
  ResourceValues,
  ResourceCategory,
  ResourceSort,
} from "../types";
export const listResources = async (
  search: string,
  page: number,
  status?: "ACTIVE" | "INACTIVE",
  size = 20,
  category?: ResourceCategory,
  sort: ResourceSort = "name,asc",
): Promise<ResourcePage> =>
  (
    await api.get("/resources", {
      params: { search, page, size, status, category, sort },
    })
  ).data;
export const getResource = async (id: string): Promise<MaterialResource> =>
  (await api.get(`/resources/${id}`)).data;
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

/** Resolve only the resources referenced by the current offer page. */
export const getResourcesByIds = async (
  ids: string[],
): Promise<MaterialResource[]> =>
  (await api.get("/resources/batch", { params: { ids: ids.join(",") } })).data;
