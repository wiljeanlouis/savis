package com.savouretplus.savis.sales.quotation.adapter.supabase;

import com.savouretplus.savis.sales.quotation.domain.QuoteRequestValidationException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.LinkedHashMap;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequest;
import com.savouretplus.savis.sales.quotation.port.QuoteRequestInbox;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j 
public class SupabaseQuoteRequestInbox implements QuoteRequestInbox {
    private final RestClient client;
    private final boolean enabled;
    private final Clock clock;
    private final JsonMapper json = JsonMapper.builder().build();

    @Autowired
    public SupabaseQuoteRequestInbox(@Value("${savis.supabase.url:}") String url,
            @Value("${savis.supabase.service-role-key:}") String key,
            @Value("${savis.supabase.enabled:false}") boolean enabled, Clock clock) {
        var factory = new JdkClientHttpRequestFactory(java.net.http.HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(5)).build());
        factory.setReadTimeout(java.time.Duration.ofSeconds(15));
        this.client = RestClient.builder().baseUrl(url).requestFactory(factory)
                .defaultHeader("apikey", key).defaultHeader("Authorization", "Bearer " + key).build();
        this.enabled = enabled;
        this.clock = clock;
    }

    SupabaseQuoteRequestInbox(RestClient client, Clock clock) {
        this.client = client;
        this.clock = clock;
        this.enabled = true;
    }

    @Override
    public List<String> pending(int limit) {
        log.info("Fetching pending quote requests with limit: {}", limit);
        if (!enabled)
            throw new InboxUnavailableException();
        try {
            String body = client.get()
                    .uri(b -> b.path("/rest/v1/quote_requests").queryParam("sync_status", "eq.pending")
                            .queryParam("order", "created_at.asc,id.asc").queryParam("limit", limit)
                            .queryParam("select", "*").build())
                    .retrieve().body(String.class);
            JsonNode rows = json.readTree(body);
            if (!rows.isArray())
                throw new InboxUnavailableException();
            List<String> result = new ArrayList<>();
            rows.forEach(row -> result.add(row.toString()));
            return result;
        } catch (RuntimeException error) {
            log.error("Error occurred while fetching pending quote requests", error);
            throw new InboxUnavailableException();
        }
    }

    @Override
    public UUID receptionId(String row) {
        log.info("Fetching reception ID for row: {}", row);
        return UUID.fromString(json.readTree(row).path("id").asText());
    }

    @Override
    public QuoteRequest decode(String row) {
        log.info("Decoding row: {}", row);
        JsonNode reception = json.readTree(row), payload = reception.path("payload");
        if (!payload.isObject() || !"QUOTE_REQUEST".equals(payload.path("type").asText())
                || !payload.path("customer").isObject() || !payload.path("event_details").isObject()
                || !payload.path("requested_services").isArray() || payload.path("requested_services").isEmpty()
                || !payload.path("items").isArray() || payload.path("items").size() > 100
                || payload.toString().getBytes(StandardCharsets.UTF_8).length > 131072)
            throw invalid();
        try { LocalDate.parse(required(payload.path("event_details"), "event_date", 10)); }
        catch (java.time.format.DateTimeParseException error) {
            throw new QuoteRequestValidationException("La date de l’événement est invalide");
        }
        required(payload.path("event_details"), "event_type", 100);
        required(payload.path("event_details"), "event_address", 500);
        required(payload.path("event_details"), "budget", 100);
        for (JsonNode item : payload.path("items")) {
            UUID.fromString(required(item, "offering_id", 36));
            required(item, "name", 300);
            if (!item.path("requested_quantity").isIntegralNumber()
                    || !item.path("requested_quantity").canConvertToInt() || item.path("requested_quantity").asInt() < 1
                    || item.path("requested_quantity").asInt() > 1000 || !item.path("configuration").isObject())
                throw invalid();
        }
        String requestType = required(payload.path("event_details"), "request_type", 100);
        var combinations = Map.of("traiteur", Set.of("traiteur"), "decoration",
                Set.of("decoration"),
                "organisation", Set.of("organisation"), "decoration-organisation",
                Set.of("decoration", "organisation"),
                "traiteur-decoration", Set.of("traiteur", "decoration"), "traiteur-decoration-organisation",
                Set.of("traiteur", "decoration", "organisation"));
        var services = new HashSet<String>();
        for (JsonNode service : payload.path("requested_services")) {
            if (!service.isTextual() || !services.add(service.asText()))
                throw invalid();
        }
        if (!services.equals(combinations.get(requestType)))
            throw invalid();
        JsonNode customer = payload.path("customer");
        String original = canonical(payload);
        var needs = new java.util.HashSet<String>();
        int index = 0;
        for (JsonNode ignored : payload.path("items"))
            needs.add("item:" + index++);
        for (JsonNode service : payload.path("requested_services")) {
            if (!service.isTextual()
                    || !java.util.Set.of("traiteur", "decoration", "organisation").contains(service.asText()))
                throw invalid();
            needs.add("service:" + service.asText());
        }
        return new QuoteRequest(null, UUID.randomUUID(), required(reception, "source", 100), receptionId(row),
                payload.hasNonNull("request_id") ? UUID.fromString(payload.path("request_id").asText()) : null,
                fingerprint(original), original, required(customer, "name", 200), required(customer, "phone", 50),
                customer.path("email").isTextual() ? customer.path("email").asText() : null,
                Instant.parse(reception.path("created_at").asText()), clock.instant(),
                com.savouretplus.savis.sales.quotation.domain.QuoteRequestStatus.RECEIVED, 0, null, null, List.of(),
                needs);
    }

    @Override
    public void acknowledge(UUID id, boolean success) {
        var body = new LinkedHashMap<String, Object>();
        body.put("sync_status", success ? "synced" : "failed");
        body.put("synced_at", success ? clock.instant().toString() : null);
        body.put("sync_error", success ? null : "INVALID_OR_CONFLICTING_REQUEST");
        // Return representation verifies a matching row; no payload is requested or
        // logged.
        String result = client.patch().uri(b -> b.path("/rest/v1/quote_requests").queryParam("id", "eq." + id)
                .queryParam("select", "id").build()).header("Prefer", "return=representation").body(body)
                .retrieve().body(String.class);
        JsonNode affected = json.readTree(result);
        if (!affected.isArray() || affected.size() != 1 || !id.toString().equals(affected.get(0).path("id").asText()))
            throw new InboxUnavailableException();
    }

    private String required(JsonNode node, String key, int max) {
        var value = node.path(key);
        if (!value.isTextual() || value.asText().isBlank() || value.asText().length() > max)
            throw new QuoteRequestValidationException("Le champ « " + key + " » est requis et doit contenir au plus " + max + " caractères");
        return value.asText();
    }

    private QuoteRequestValidationException invalid() {
        return new QuoteRequestValidationException("Le contenu de la demande publique est invalide ou incomplet");
    }

    private String canonical(JsonNode node) {
        if (node.isObject()) {
            var sorted = new java.util.TreeMap<String, JsonNode>();
            node.properties().forEach(e -> sorted.put(e.getKey(), e.getValue()));
            return "{" + sorted.entrySet().stream()
                    .map(e -> json.writeValueAsString(e.getKey()) + ":" + canonical(e.getValue()))
                    .collect(java.util.stream.Collectors.joining(",")) + "}";
        }
        if (node.isArray()) {
            List<String> values = new ArrayList<>();
            node.forEach(v -> values.add(canonical(v)));
            return "[" + String.join(",", values) + "]";
        }
        return node.toString();
    }

    private String fingerprint(String value) {
        try {
            return HexFormat.of()
                    .formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException(error);
        }
    }
}
