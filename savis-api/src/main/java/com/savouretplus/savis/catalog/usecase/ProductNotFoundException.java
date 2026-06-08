package com.savouretplus.savis.catalog.usecase;

import java.util.UUID;

public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(UUID productId) {
        super("Produit introuvable: " + productId);
    }
}
