package com.savouretplus.savis.sales.quotation.adapter.supabase;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
import java.time.Clock;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.http.MediaType;
class SupabaseQuoteRequestInboxTest {
    final RestClient.Builder builder=RestClient.builder().baseUrl("https://test.invalid");
    final MockRestServiceServer server=MockRestServiceServer.bindTo(builder).build();
    final SupabaseQuoteRequestInbox inbox=new SupabaseQuoteRequestInbox(builder.build(),Clock.systemUTC());
    String row(String customer) { return """
        {"id":"10000000-0000-4000-8000-000000000001","source":"savouretplus","created_at":"2026-10-31T12:00:00Z",
         "payload":{"type":"QUOTE_REQUEST","customer":%s,"requested_services":["organisation"],
          "event_details":{"request_type":"organisation","event_date":"2027-01-01","event_type":"Mariage","event_address":"Montréal","budget":"À préciser"},"items":[]}}
        """.formatted(customer); }
    @Test void canonicalFingerprintIgnoresObjectKeyOrderAndHistoricalSubmissionIdCanBeAbsent() {
        var a=inbox.decode(row("{\"name\":\"Client\",\"phone\":\"5145550123\"}"));
        var b=inbox.decode(row("{\"phone\":\"5145550123\",\"name\":\"Client\"}"));
        assertEquals(a.fingerprint(),b.fingerprint());assertNull(a.submissionRequestId());
        assertEquals(java.util.Set.of("service:organisation"),a.needKeys());
    }
    @Test void malformedRowDoesNotBreakRawBatchAndAcknowledgementRequiresAffectedRow() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString("limit=100"))).andRespond(withSuccess("[{\"id\":123},{}]",MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("select=id"))).andExpect(header("Prefer","return=representation"))
                .andRespond(withSuccess("[]",MediaType.APPLICATION_JSON));
        assertEquals(2,inbox.pending(100).size());
        assertThrows(RuntimeException.class,()->inbox.decode("{}"));
        assertThrows(InboxUnavailableException.class,()->inbox.acknowledge(UUID.randomUUID(),true));server.verify();
    }
}
