package com.savouretplus.savis.catalog.adapter.supabase;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.savouretplus.savis.catalog.port.PublishedCatalogPort;
import com.savouretplus.savis.catalog.port.PublishedCatalogProduct;

/**
 * Published catalog adapter used when external publication is disabled.
 */
@Component
@ConditionalOnProperty(name = "savis.supabase.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpPublishedCatalogAdapter implements PublishedCatalogPort {

    /**
     * Reports whether the adapter is enabled.
     */
    @Override
    public boolean isEnabled() {
        return false;
    }

    /**
     * Publishes catalog products or outbound events through the configured port.
     */
    @Override
    public void publish(PublishedCatalogProduct product) {
        // Publication is intentionally disabled when Supabase is not configured.
    }

    /**
     * Removes a previously published catalog product.
     */
    @Override
    public void unpublish(String productId) {
        // Publication is intentionally disabled when Supabase is not configured.
    }
}
