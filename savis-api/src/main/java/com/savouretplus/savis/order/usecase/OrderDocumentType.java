package com.savouretplus.savis.order.usecase;

import java.util.Locale;

/**
 * Identifies customer-facing documents generated from an order snapshot.
 */
public enum OrderDocumentType {
    QUOTE("quote", "soumission"),
    INVOICE("invoice", "facture");

    private final String slug;
    private final String frenchName;

    OrderDocumentType(String slug, String frenchName) {
        this.slug = slug;
        this.frenchName = frenchName;
    }

    /**
     * Returns the URL-safe document identifier.
     */
    public String slug() {
        return slug;
    }

    /**
     * Returns the lowercase French document name used in filenames.
     */
    public String frenchName() {
        return frenchName;
    }

    /**
     * Resolves a public document slug.
     */
    public static OrderDocumentType fromSlug(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        for (OrderDocumentType type : values()) {
            if (type.slug.equals(normalized)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Type de document inconnu: " + value);
    }
}
