package com.savouretplus.savis.sales.order.adapter.supabase;

import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.savouretplus.savis.sales.order.port.OrderInbox;
import com.savouretplus.savis.sales.order.port.PendingCustomerOrder;

/**
 * Reads and acknowledges customer orders through the Supabase PostgREST API.
 */
@Component
@ConditionalOnProperty(name = "savis.supabase.enabled", havingValue = "true")
public class SupabaseOrderInboxAdapter implements OrderInbox {
    private static final String RETURN_MINIMAL = "return=minimal";

    private final RestClient client;
    private final SupabaseCustomerOrderMapper mapper;
    private final Clock clock;

    /**
     * Creates the Supabase inbox adapter with service-role credentials.
     */
    @Autowired
    public SupabaseOrderInboxAdapter(
            @Value("${savis.supabase.url}") String supabaseUrl,
            @Value("${savis.supabase.service-role-key}") String serviceRoleKey,
            SupabaseCustomerOrderMapper mapper,
            Clock clock) {
        this(RestClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", serviceRoleKey)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                .build(), mapper, clock);
    }

    SupabaseOrderInboxAdapter(RestClient client, SupabaseCustomerOrderMapper mapper, Clock clock) {
        this.client = client;
        this.mapper = mapper;
        this.clock = clock;
    }

    /**
     * Reports that the configured Supabase inbox is enabled.
     */
    @Override
    public boolean isEnabled() {
        return true;
    }

    /**
     * Reads pending rows and converts them into provider-neutral import snapshots.
     */
    @Override
    public List<PendingCustomerOrder> fetchPending() {
        SupabaseCustomerOrderResponse[] response = client.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/rest/v1/customer_orders")
                        .queryParam("sync_status", "eq.pending")
                        .queryParam("order", "created_at.asc")
                        .queryParam("select", "*")
                        .build())
                .retrieve()
                .body(SupabaseCustomerOrderResponse[].class);
        if (response == null) {
            return List.of();
        }
        return Arrays.stream(response).map(mapper::map).toList();
    }

    /**
     * Marks a pending Supabase row as synchronized.
     */
    @Override
    public void markSynced(UUID externalOrderId) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sync_status", "synced");
        body.put("synced_at", Instant.now(clock));
        body.put("sync_error", null);
        updatePending(externalOrderId, body);
    }

    /**
     * Marks a pending Supabase row as failed with the provided error.
     */
    @Override
    public void markFailed(UUID externalOrderId, String error) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sync_status", "failed");
        body.put("sync_error", error);
        updatePending(externalOrderId, body);
    }

    private void updatePending(UUID externalOrderId, Map<String, Object> body) {
        client.patch()
                .uri(uriBuilder -> uriBuilder
                        .path("/rest/v1/customer_orders")
                        .queryParam("id", "eq." + externalOrderId)
                        .queryParam("sync_status", "eq.pending")
                        .build())
                .header("Prefer", RETURN_MINIMAL)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }

}
