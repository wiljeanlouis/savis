export interface RequestedConfiguration {
  purchase_mode?: { label?: string; quantity?: number };
  selection?: { choice_name?: string };
  allocation?: { choice_name?: string; quantity?: number }[];
  ingredients?: { name?: string; quantity?: number }[];
}
export interface OriginalPayload {
  customer?: { note?: string };
  requested_services?: string[];
  event_details?: {
    event_type?: string;
    event_date?: string;
    event_time?: string;
    event_address?: string;
    guest_count?: number;
    budget?: string;
    allergies?: string;
    note?: string;
  };
  items?: {
    offering_id?: string;
    name: string;
    requested_quantity: number;
    configuration?: RequestedConfiguration;
    note?: string;
  }[];
}
export function parseOriginalRequest(payload: string): OriginalPayload {
  try {
    const value: unknown = JSON.parse(payload);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as OriginalPayload)
      : {};
  } catch {
    return {};
  }
}
export const serviceLabels: Record<string, string> = {
  traiteur: "Traiteur",
  decoration: "Décoration",
  organisation: "Organisation",
};
export function needLabel(key: string, payload: OriginalPayload) {
  if (key.startsWith("item:")) {
    const index = Number(key.slice(5));
    return payload.items?.[index]?.name ?? `Article demandé ${index + 1}`;
  }
  const service = key.slice(8);
  return serviceLabels[service] ?? service;
}
export function configurationLabels(configuration?: RequestedConfiguration) {
  if (!configuration) return [];
  return [
    configuration.purchase_mode?.label,
    configuration.selection?.choice_name,
    ...(configuration.allocation ?? []).map((v) =>
      v.choice_name ? `${v.choice_name} × ${v.quantity ?? 1}` : null,
    ),
    ...(configuration.ingredients ?? []).map((v) =>
      v.name ? `${v.name} × ${v.quantity ?? 1}` : null,
    ),
  ].filter((v): v is string => !!v);
}
