export type SavisTaskStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";

export type SavisTaskType = "GET_OFFERS" | "REFRESH_OFFER";

export interface SavisTask {
  id: string;
  type: SavisTaskType;
  payload: Record<string, string>;
  status: SavisTaskStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface SavisTasksPage {
  items: SavisTask[];
  page: number;
  size: number;
  total_items: number;
  total_pages: number;
}

export type CreateSavisTaskPayload =
  | {
      type: "GET_OFFERS";
      payload: {
        search_term: string;
        type?: "FOOD" | "DECORATION";
      };
    }
  | {
      type: "REFRESH_OFFER";
      payload: {
        offer_id: string;
        url: string;
      };
    };
