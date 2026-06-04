import { api } from "@/shared/api";
import type { ActivityRate, ActivityType } from "../types";

export const getActivityRates = async (): Promise<ActivityRate[]> => {
  const { data }: { data: ActivityRate[] } = await api.get("/activity-rates");
  return data;
};

export const createActivityRate = async (
  activityRate: ActivityRate,
): Promise<ActivityRate> => {
  const { data }: { data: ActivityRate } = await api.post(
    "/activity-rates",
    activityRate,
  );
  return data;
};

export const updateActivityRate = async (
  activityRate: ActivityRate,
): Promise<ActivityRate> => {
  const { data }: { data: ActivityRate } = await api.put(
    `/activity-rates/${activityRate.activityType}`,
    activityRate,
  );
  return data;
};

export const deleteActivityRate = async (activityType: ActivityType) => {
  return api.delete(`/activity-rates/${activityType}`);
};
