package com.savouretplus.savis.catalog.adapter.supabase;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.savouretplus.savis.catalog.port.PublishedCatalogPort;
import com.savouretplus.savis.catalog.port.PublishedCatalogProduct;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@ConditionalOnProperty(name = "savis.supabase.enabled", havingValue = "true")
public class SupabaseCatalogAdapter implements PublishedCatalogPort {

    private static final String PREFER_UPSERT = "resolution=merge-duplicates,return=minimal";

    private final RestClient client;

    public SupabaseCatalogAdapter(
            @Value("${savis.supabase.url}") String supabaseUrl,
            @Value("${savis.supabase.service-role-key}") String serviceRoleKey) {
                log.info("supabaseUrl {}", supabaseUrl);
                log.info("serviceRoleKey {}", serviceRoleKey);
        this.client = RestClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", serviceRoleKey)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                .build();
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public void publish(PublishedCatalogProduct product) {
        log.info("Publish to supabase {}", product);
        client.post()
                .uri("/rest/v1/published_catalog_products?on_conflict=id")
                .header("Prefer", PREFER_UPSERT)
                .body(SupabasePublishedCatalogProductRequest.from(product))
                .retrieve()
                .toBodilessEntity();
    }

    @Override
    public void unpublish(String productId) {
        client.delete()
                .uri(uriBuilder -> uriBuilder
                        .path("/rest/v1/published_catalog_products")
                        .queryParam("id", "eq." + productId)
                        .build())
                .retrieve()
                .toBodilessEntity();
    }
}
