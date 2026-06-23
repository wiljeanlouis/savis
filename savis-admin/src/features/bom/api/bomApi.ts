import { api } from "../../../shared/api";
import { type Bom, type BomPrice } from "../types";

export const createBom = async (bom: Bom): Promise<string> => {
  const { data }: { data: string } = await api.post("/boms", bom);
  return data;
};

export const getBom = async (id: string): Promise<Bom> => {
  const { data }: { data: Bom } = await api.get(`/boms/${id}`);
  return data;
};

export const getBomPrice = async (id: string): Promise<BomPrice> => {
  const { data }: { data: BomPrice } = await api.get(`/boms/${id}/price`);
  return data;
};

export const deleteBom = async (id: string) => {
  return api.delete(`/boms/${id}`);
};

export const getBoms = async (): Promise<Bom[]> => {
  const { data }: { data: Bom[] } = await api.get("/boms");
  return data;
};
