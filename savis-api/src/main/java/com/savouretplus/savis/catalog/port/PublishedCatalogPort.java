package com.savouretplus.savis.catalog.port;

public interface PublishedCatalogPort {

    boolean isEnabled();

    void publish(PublishedCatalogProduct product);

    void unpublish(String productId);
}
