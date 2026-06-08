package com.savouretplus.savis.catalog.usecase;

import java.util.UUID;

public class ProductCategoryNotFoundException extends RuntimeException {

    public ProductCategoryNotFoundException(UUID categoryId) {
        super("Catégorie de produit introuvable: " + categoryId);
    }
}
