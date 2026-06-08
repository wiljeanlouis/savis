package com.savouretplus.savis.catalog.adapter.supabase;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.savouretplus.savis.catalog.port.PublishedCatalogPort;
import com.savouretplus.savis.catalog.port.PublishedCatalogProduct;

@Component
@ConditionalOnProperty(name = "savis.supabase.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpPublishedCatalogAdapter implements PublishedCatalogPort {

    @Override
    public boolean isEnabled() {
        return false;
    }

    @Override
    public void publish(PublishedCatalogProduct product) {
        // Publication is intentionally disabled when Supabase is not configured.
    }

    @Override
    public void unpublish(String productId) {
        // Publication is intentionally disabled when Supabase is not configured.
    }
}
