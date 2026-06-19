package com.savouretplus.savis.catalog.usecase;

import java.util.UUID;

/**
 * Exception thrown when a product category cannot be found.
 */
public class ProductCategoryNotFoundException extends RuntimeException {

    /**
     * Creates an exception for a missing product category identifier.
     */
    public ProductCategoryNotFoundException(UUID categoryId) {
        super("Catégorie de produit introuvable: " + categoryId);
    }
}
