import type { Bom } from "../types";
import { useDeleteBom, useGetBoms } from "./useBomApi";

export const useBomList = () => {
  const useQuery = useGetBoms();
  const useMutation = useDeleteBom();

  const deleteBom = async (id: string) => {
    await useMutation.mutateAsync(id);
  };

  return {
    boms: useQuery.data as Bom[] | undefined,
    isLoading: useQuery.isPending,
    isError: useQuery.isError,
    error: useQuery.error,
    deleteBom: deleteBom,
  };
};
