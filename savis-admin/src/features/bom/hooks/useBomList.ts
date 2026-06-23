import type { Bom } from "../types";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useDeleteBom, useGetBoms, usePostBom } from "./useBomApi";

const createBomClone = (bom: Bom): Bom => {
  return {
    ...bom,
    id: null,
    name: `${bom.name} (copie)`,
    price: null,
    components: bom.components.map((component) => ({ ...component })),
    activities: bom.activities.map((activity) => {
      const activityClone = { ...activity };
      delete activityClone.id;
      return activityClone;
    }),
    yield: { ...bom.yield },
  };
};

export const useBomList = () => {
  const useQuery = useGetBoms();
  const deleteMutation = useDeleteBom();
  const cloneMutation = usePostBom();
  const navigate = useNavigate();

  const deleteBom = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const cloneBom = async (bom: Bom) => {
    try {
      const clonedBom = createBomClone(bom);
      const clonedBomId = await cloneMutation.mutateAsync(clonedBom);
      toast.success("BOM cloné avec succès.");
      await navigate(`/boms/${clonedBomId}`);
    } catch (error) {
      const errorResponse = error as {
        response?: { data?: { detail?: string } };
      };
      toast.error("Le clonage du BOM a échoué.", {
        description: errorResponse.response?.data?.detail,
      });
    }
  };

  return {
    boms: useQuery.data as Bom[] | undefined,
    isLoading: useQuery.isPending,
    isError: useQuery.isError,
    error: useQuery.error,
    deleteBom: deleteBom,
    cloneBom,
    isCloning: cloneMutation.isPending,
  };
};
