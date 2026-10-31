package com.savouretplus.savis.order.adapter.supabase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class SupabaseOrderInboxAdapterTest {
    private static final UUID ORDER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");

    @Test
    void readsPendingRowsAndAcknowledgesThemWithServerOnlyCredentials() {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl("https://example.supabase.co")
                .defaultHeader("apikey", "service-role-key")
                .defaultHeader("Authorization", "Bearer service-role-key");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(containsString("sync_status=eq.pending")))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("apikey", "service-role-key"))
                .andRespond(withSuccess("""
                        [{
                          "id":"10000000-0000-4000-8000-000000000001",
                          "customer_name":"Ada",
                          "customer_phone":"514",
                          "customer_email":null,
                          "note":null,
                          "status":"new",
                          "source":"savouretplus",
                          "total_cents":1200,
                          "items":[{
                            "key":"cookie:default",
                            "product_id":"20000000-0000-4000-8000-000000000002",
                            "name":"Biscuit",
                            "product_type":"standard",
                            "base_price_cents":1200,
                            "unit_price_cents":1200,
                            "purchase_mode":null,
                            "selection":null,
                            "allocation":[],
                            "ingredients":[],
                            "quantity":1,
                            "image_url":null
                          }],
                          "created_at":"2026-08-08T14:00:00Z",
                          "sync_status":"pending",
                          "synced_at":null,
                          "sync_error":null,
                          "notified_at":null
                        }]
                        """, MediaType.APPLICATION_JSON));
        server.expect(requestTo(containsString("id=eq." + ORDER_ID)))
                .andExpect(method(HttpMethod.PATCH))
                .andExpect(content().json("{\"sync_status\":\"synced\"}"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        SupabaseOrderInboxAdapter adapter = new SupabaseOrderInboxAdapter(
                builder.build(), new SupabaseCustomerOrderMapper(),
                Clock.fixed(Instant.parse("2026-08-08T15:00:00Z"), ZoneOffset.UTC));
        var pending = adapter.fetchPending();
        adapter.markSynced(ORDER_ID);

        assertEquals(1, pending.size());
        assertEquals("Ada", pending.getFirst().customerName());
        assertEquals(1200, pending.getFirst().totalCents());
        assertEquals("standard", pending.getFirst().items().getFirst().productType());
        assertEquals(ORDER_ID.toString(), pending.getFirst().rawPayload().get("id"));
        server.verify();
    }
}
