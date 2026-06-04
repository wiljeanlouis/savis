import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createActivityRate,
  deleteActivityRate,
  getActivityRates,
  updateActivityRate,
} from "../api/activityRateApi";

const ACTIVITY_RATES_QUERY_KEY = ["activity-rates"];

export const useGetActivityRates = () => {
  return useQuery({
    queryKey: ACTIVITY_RATES_QUERY_KEY,
    queryFn: getActivityRates,
  });
};

export const useCreateActivityRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createActivityRate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ACTIVITY_RATES_QUERY_KEY,
      });
    },
  });
};

export const useUpdateActivityRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateActivityRate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ACTIVITY_RATES_QUERY_KEY,
      });
    },
  });
};

export const useDeleteActivityRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteActivityRate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ACTIVITY_RATES_QUERY_KEY,
      });
    },
  });
};
