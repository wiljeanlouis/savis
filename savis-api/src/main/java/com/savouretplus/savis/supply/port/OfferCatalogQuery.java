package com.savouretplus.savis.supply.port;

import com.savouretplus.savis.supply.domain.OfferStatus;

/** Carries validated filtering and pagination criteria to the Supply repository. */
public record OfferCatalogQuery(
        int page,
        int size,
        String search,
        OfferStatus status,
        OfferCatalogSort sort) {

    /** Validates pagination and normalizes optional text search. */
    public OfferCatalogQuery {
        if (page < 0) {
            throw new IllegalArgumentException("Le numéro de page doit être positif ou nul");
        }
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("La taille de page doit être comprise entre 1 et 100");
        }
        if (sort == null) {
            throw new IllegalArgumentException("Le tri des offres est requis");
        }
        search = search == null || search.isBlank() ? null : search.trim();
    }
}
