package com.savouretplus.savis.catalog.domain;

/**
 * Catalog category chosen directly on a product.
 */
public enum ProductCategory {
    TASTING("tasting", "Dégustation"),
    DECORATION("decoration", "Décoration");

    private final String code;
    private final String label;

    ProductCategory(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String code() {
        return code;
    }

    public String label() {
        return label;
    }
}
