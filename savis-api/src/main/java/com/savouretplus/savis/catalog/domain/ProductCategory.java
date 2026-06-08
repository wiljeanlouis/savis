package com.savouretplus.savis.catalog.domain;

import java.util.UUID;

public record ProductCategory(
        UUID publicId,
        String code,
        String name,
        boolean active,
        int displayOrder) {

    public ProductCategory {
        publicId = publicId != null ? publicId : UUID.randomUUID();
        requireText(code, "Le code de catégorie est requis");
        requireText(name, "Le nom de catégorie est requis");
        if (displayOrder < 0) {
            throw new IllegalArgumentException("L'ordre d'affichage ne peut pas être négatif");
        }
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
