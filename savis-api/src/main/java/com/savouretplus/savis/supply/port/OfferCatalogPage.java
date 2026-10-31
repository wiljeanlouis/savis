package com.savouretplus.savis.supply.port;

import java.util.List;

import com.savouretplus.savis.supply.domain.Offer;

/** Contains one database-backed page of supplier offers. */
public record OfferCatalogPage(
        List<Offer> content,
        long totalElements,
        int totalPages) {

    /** Protects the page content from external mutation. */
    public OfferCatalogPage {
        content = List.copyOf(content);
    }
}
