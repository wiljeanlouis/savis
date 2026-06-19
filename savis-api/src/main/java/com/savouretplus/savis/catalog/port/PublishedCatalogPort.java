package com.savouretplus.savis.catalog.port;

/**
 * Defines the outbound port used to publish catalog products.
 */
public interface PublishedCatalogPort {

    /**
     * Reports whether the adapter is enabled.
     */
    boolean isEnabled();

    /**
     * Publishes catalog products or outbound events through the configured port.
     */
    void publish(PublishedCatalogProduct product);

    /**
     * Removes a previously published catalog product.
     */
    void unpublish(String productId);
}
