package com.savouretplus.savis.catalog.usecase;

import java.util.UUID;

/**
 * Exception thrown when a catalog product cannot be found.
 */
public class ProductNotFoundException extends RuntimeException {

    /**
     * Creates an exception for a missing product identifier.
     */
    public ProductNotFoundException(UUID productId) {
        super("Produit introuvable: " + productId);
    }
}
