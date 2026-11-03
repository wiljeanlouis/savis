package com.savouretplus.savis.sales.order.adapter.supabase;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Represents the PostgREST response shape for a row in {@code public.customer_orders}.
 */
record SupabaseCustomerOrderResponse(
        UUID id,
        String customer_name,
        String customer_phone,
        String customer_email,
        Map<String, String> customer_address,
        String note,
        String status,
        String source,
        Integer discount_cents,
        Integer delivery_fee_cents,
        int total_cents,
        List<Map<String, Object>> items,
        Instant created_at,
        String sync_status,
        Instant synced_at,
        String sync_error,
        Instant notified_at) {
}
